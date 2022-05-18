import { Sequelize, Op } from "sequelize";
import DB from "../db/index.js";

export const getAll = async (req, res, next) => {
  try {
    const tasks = await DB.Tasks.findAll({
      order: ["index"],
      include: DB.AssignedUsers,
    });
    const result = parseTasks(tasks);
    res.send(result);
  } catch (err) {
    return next(err);
  }
};

export const getFromProject = async (req, res, next) => {
  try {
    const project = parseInt(req.params.id) || null;
    const tasks = await DB.Tasks.findAll({
      order: ["index"],
      where: { project },
      include: DB.AssignedUsers,
    });

    const result = parseTasks(tasks);
    res.send(result);
  } catch (err) {
    return next(err);
  }
};

export const add = async (req, res, next) => {
  try {
    const data = parseTaskInfo(req.body);

    let index;
    if (data.helperId) {
      const helperTask = await getOne(data.helperId);
      if (!helperTask) {
        throw new Error("task not found, id: " + data.helperId);
      }

      if (data.helperId == data.parent) {
        // add sub-task
        index = await getMinIndex(helperTask.project, helperTask.id);
      } else {
        // add task below
        index = helperTask.index;
        const dir = await updateIndex(
          helperTask.project,
          helperTask.parent,
          index,
          1
        );
        if (dir > 0) {
          index++;
        }
      }
    } else {
      // add task at the start of the tree
      index = await getMinIndex(data.project, null);
    }

    const task = await DB.Tasks.create({
      parent: data.parent,
      project: data.project,
      index,
    });
    res.send({ id: task.id });
  } catch (err) {
    return next(err);
  }
};

export const update = async (req, res, next) => {
  const tx = await DB.instance.transaction();
  try {
    const id = req.params.id;
    const data = parseTaskInfo(req.body);
    delete data.index;

    await updateOne(id, taskFields(data), tx);
    await setAssignedUsers(id, data.assigned, tx);

    if (data.bunch) {
      for (const v of data.bunch) {
        await updateOne(v.id, taskFields(v), tx);
      }
    }

    await tx.commit();
    res.send({});
  } catch (err) {
    await tx.rollback();
    return next(err);
  }
};

export const remove = async (req, res, next) => {
  const tx = await DB.instance.transaction();
  try {
    const id = parseInt(req.params.id);

    const task = await getOne(id);
    if (!task) {
      throw new Error("task not found, id: " + id);
    }

    const children = await getChildrenIds(task.project, id);
    children.push(task.id);

    await DB.AssignedUsers.destroy({
      where: { task_id: { [Op.in]: children } },
      transaction: tx,
    });
    await DB.Tasks.destroy({
      where: { id: { [Op.in]: children } },
      transaction: tx,
    });

    await updateIndex(task.project, task.parent, task.index, -1, tx);

    await tx.commit();
    res.send({});
  } catch (err) {
    await tx.rollback();
    return next(err);
  }
};

export const clone = async (req, res, next) => {
  const tx = await DB.instance.transaction();
  try {
    const data = parseTaskInfo(req.body);
    if (!data.bunch) {
      throw new Error("nothing to clone");
    }

    const helperTask = await getOne(data.helperId);
    if (!helperTask) {
      throw new Error("task not found, id: " + data.helperId);
    }

    const it = taskFields(data.bunch[0]);
    delete it.id;
    it.parent = data.parent;
    let index = helperTask.index;

    const dir = await updateIndex(
      helperTask.project,
      helperTask.parent,
      index,
      1,
      tx
    );
    if (dir > 0) {
      index++;
    }
    it.index = index;
    const task = await DB.Tasks.create(it, { transaction: tx });
    await setAssignedUsers(task.id, it.assigned, tx);

    const idPull = {
      [data.bunch[0].id]: task.id,
    };

    if (data.bunch.length > 1) {
      const indexPull = {};

      for (let i = 1; i < data.bunch.length; i++) {
        const it = taskFields(data.bunch[i]);
        delete it.id;
        it.parent = idPull[it.parent];
        it.index = indexPull[it.parent] || 0;
        const task = await DB.Tasks.create(it, { transaction: tx });
        await setAssignedUsers(task.id, it.assigned, tx);

        idPull[data.bunch[i].id] = task.id;
        indexPull[task.parent] = ++it.index;
      }
    }

    await tx.commit();

    res.send(idPull);
  } catch (err) {
    await tx.rollback();
    return next(err);
  }
};

export const move = async (req, res, next) => {
  try {
    const data = parseTaskInfo({ id: req.params.id, ...req.body });

    if (
      data.id == data.parent ||
      data.id == data.helperId ||
      !(await getOne(data.id))
    ) {
      throw new Error("invalid incoming data");
    }

    switch (data.operation) {
      case "project":
        await moveToProject(data);
        break;
      case "indent":
      case "unindent":
        await shiftTask(data);
        break;
      default:
        await moveTask(data);
    }

    res.send({});
  } catch (err) {
    return next(err);
  }
};

// helpers

async function moveTask(data) {
  const task = await getOne(data.id);
  if (!task) {
    return new Error("task not found, id: " + data.id);
  }

  let helperTask;
  if (data.reverse) {
    helperTask = await getOne(data.helperId);
  } else {
    helperTask = await getNextTaskByIndex(
      task.project,
      task.parent,
      task.index
    );
  }
  if (!helperTask) {
    return;
  }

  const tx = await DB.instance.transaction();
  try {
    await updateOne(task.id, { index: helperTask.index }, tx);
    await updateOne(helperTask.id, { index: task.index }, tx);
    await tx.commit();
  } catch {
    await tx.rollback();
  }
}

async function moveToProject(data) {
  const tx = await DB.instance.transaction();
  try {
    if (typeof data.project == "undefined") {
      throw new Error("project value is undefined");
    }
    if (data.project !== null && !(await existsProject(data.project))) {
      throw new Error("project not found");
    }

    const task = await getOne(data.id);
    if (!task) {
      throw new Error("task not found, id: " + data.id);
    }
    if (task.project == data.project) {
      return;
    }

    const old = taskFields(task);

    task.parent = 0;
    task.project = data.project;
    task.index = await getMaxIndex(data.project, null);
    await updateOne(task.id, taskFields(task), tx);

    const childrenIds = await getChildrenIds(old.project, task.id);
    if (childrenIds) {
      await DB.Tasks.update(
        {
          project: task.project,
        },
        {
          where: { id: { [Op.in]: childrenIds } },
          transaction: tx,
        }
      );
    }

    await updateIndex(old.project, old.parent, old.index, -1, tx);

    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

async function shiftTask(data) {
  const tx = await DB.instance.transaction();
  try {
    const task = await getOne(data.id);
    if (!task) {
      throw new Error("task not found, id: " + data.id);
    }

    let index;
    if (data.operation == "indent") {
      const parentTask = await getOne(data.parent);
      if (!parentTask) {
        throw new Error("task not found, id: " + data.parent);
      }

      index = await getMaxIndex(task.project, data.parent);
      await updateIndex(task.project, task.parent, parentTask.index, -1, tx);
    } else {
      const parentTask = await getOne(task.parent);
      if (!parentTask) {
        throw new Error("task not found, id: " + data.id);
      }

      const nextTask = await getNextTaskByIndex(
        task.project,
        parentTask.parent,
        parentTask.index
      );
      if (!nextTask) {
        index = parentTask.index + 1;
      } else {
        index = nextTask.index;
        const dir = await updateIndex(
          task.project,
          parentTask.parent,
          index - 1,
          1,
          tx
        );
        if (dir < 0) {
          index--;
        }
      }
    }

    task.index = index;
    task.parent = data.parent;
    await updateOne(task.id, taskFields(task), tx);

    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

async function getOne(id) {
  if (!id) return null;
  return await DB.Tasks.findByPk(id);
}

async function updateOne(id, fields, tx) {
  const task = await getOne(id);
  if (!task) {
    throw new Error("task not found");
  }

  return await DB.Tasks.update(fields, {
    where: { id },
    transaction: tx,
  });
}

async function getMinIndex(project, parent) {
  if (typeof project === "undefined") {
    throw new Error("project value is undefined");
  }
  const task = await DB.Tasks.findOne({
    where: {
      project,
      parent: parent || null,
    },
    order: ["index"],
  });
  if (task) {
    return task.index - 1;
  }
  return 0;
}

async function getMaxIndex(project, parent) {
  if (typeof project == "undefined") {
    throw new Error("project value is undefined");
  }
  const task = await DB.Tasks.findOne({
    where: {
      project,
      parent: parent || null,
    },
    order: [["index", "DESC"]],
  });
  if (task) {
    return task.index + 1;
  }
  return 0;
}

async function getMinDistance(project, parent, index) {
  const toEnd =
    (await DB.Tasks.count({
      where: {
        project,
        parent: parent || null,
        index: { [Op.gt]: index - 1 },
      },
    })) || 1;

  const toStart =
    (await DB.Tasks.count({
      where: {
        project,
        parent: parent || null,
        index: { [Op.lt]: index - 1 },
      },
    })) || 1;

  return toEnd > toStart ? -toStart : toEnd;
}

async function getNextTaskByIndex(project, parent, index) {
  const task = await DB.Tasks.findOne({
    where: {
      project,
      parent: parent || null,
      index: { [Op.gt]: index },
    },
    order: ["index"],
  });

  return task;
}

async function setAssignedUsers(taskId, assigned, tx) {
  const taskUsers = await DB.AssignedUsers.findAll({
    where: { task_id: taskId },
  });
  if (arraysEqual(assigned, taskUsers)) {
    return;
  }
  await DB.AssignedUsers.destroy({
    where: { task_id: taskId },
    transaction: tx,
  });
  if (assigned) {
    const arr = [];
    for (const uid of assigned) {
      arr.push({ task_id: taskId, user_id: uid });
    }
    await DB.AssignedUsers.bulkCreate(arr, {
      transaction: tx,
    });
  }
}

async function updateIndex(project, parent, from, offset, tx) {
  if (typeof project === "undefined") {
    throw new Error("project value is undefined");
  }

  const direction = await getMinDistance(project, parent, from);

  if (direction < 0) {
    await DB.Tasks.update(
      {
        index: Sequelize.literal("`index` - " + offset),
      },
      {
        where: {
          project,
          parent: parent || null,
          index: { [Op.lt]: from + 1 },
        },
        transaction: tx,
      }
    );
  } else {
    await DB.Tasks.update(
      {
        index: Sequelize.literal("`index` + " + offset),
      },
      {
        where: {
          project,
          parent: parent || null,
          index: { [Op.gt]: from },
        },
        transaction: tx,
      }
    );
  }

  return direction;
}

async function existsProject(id) {
  if (!id) return false;
  const proj = await DB.Projects.findOne({ where: { id } });
  return !!(proj && proj.id);
}

function parseTaskInfo(obj) {
  if (!obj) {
    return null;
  }
  return {
    operation: obj.operation || "",
    helperId: obj.targetId || null,
    reverse: obj.reverse || false,
    bunch: obj.bunch || [],
    ...taskFields(obj),
  };
}

function taskFields(obj) {
  if (!obj) {
    return null;
  }

  return {
    id: obj.id,
    text: obj.text || "",
    checked: obj.checked || false,
    due_date: obj.due_date || null,
    parent: obj.parent || null,
    project: obj.project || null,
    assigned: obj.assigned || null,
    index: obj.index,
  };
}

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;
  a.sort((a, b) => b - a);
  b.sort((a, b) => b - a);

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function parseTasks(tasks) {
  const arr = new Array(tasks.length);
  for (let i = 0; i < tasks.length; i++) {
    arr[i] = taskFields(tasks[i]);
    if (tasks[i].AssignedUsers) {
      arr[i].assigned = tasks[i].AssignedUsers.map((v) => v.user_id);
    }
  }
  return arr;
}

async function getChildrenIds(project, id) {
  if (typeof project === "undefined") {
    throw new Error("project value is undefined");
  }

  const tasks = await DB.Tasks.findAll({
    where: {
      project,
    },
    order: ["index"],
  });

  return findChildren(tasks, id);
}

function findChildren(tasks, id) {
  if (!hasChildren(tasks, id)) {
    return [];
  }

  let storage = [];
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].parent == id) {
      storage.push(tasks[i].id);
      storage.push(...findChildren(tasks, tasks[i].id));
    }
  }
  return storage;
}

function hasChildren(tasks, id) {
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].parent == id) {
      return i;
    }
  }
  return -1;
}
