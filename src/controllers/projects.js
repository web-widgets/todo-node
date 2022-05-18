import { Op } from "sequelize";
import DB from "../db/index.js";

export const get = async (req, res, next) => {
  try {
    const projects = await DB.Projects.findAll();
    const result = [{ id: null, label: "No project" }, ...projects];
    res.send(result);
  } catch (err) {
    return next(err);
  }
};

export const add = async (req, res, next) => {
  try {
    const data = req.body;

    if (!data.label) {
      throw new Error("object is empty");
    }

    const project = await DB.Projects.create(data);
    res.send({ id: project.id });
  } catch (err) {
    return next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const id = req.params.id;
    const data = req.body;

    await DB.Projects.update(data, { where: { id } });
    res.send({});
  } catch (err) {
    return next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const id = req.params.id;

    const tasks = await DB.Tasks.findAll({ where: { project: id } });
    const ids = tasks.map((v) => v.id);
    await DB.AssignedUsers.destroy({
      where: { task_id: { [Op.in]: ids } },
    });
    await DB.Tasks.destroy({ where: { project: id } });
    await DB.Projects.destroy({ where: { id } });

    res.send({});
  } catch (err) {
    return next(err);
  }
};
