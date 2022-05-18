import initTask from "./models/task.js";
import initProject from "./models/project.js";
import initUser from "./models/user.js";
import initAssignedUsers from "./models/assined_users.js";

import DBConfig from "./config.js";
import initTag from "./models/tags.js";
import getDriver from "./driver/index.js";

// const instance = new Sequelize(DBConfig.DB, DBConfig.USER, DBConfig.PASS, {
//   host: DBConfig.HOST,
//   dialect: DBConfig.dialect,
//   logging: false,
// });
const driver = getDriver(DBConfig.TYPE);
const instance = driver.getConnection(DBConfig);

const DB = {
  instance,
  driver,
  Tasks: initTask(instance),
  Projects: initProject(instance),
  Users: initUser(instance),
  AssignedUsers: initAssignedUsers(instance),
  Tags: initTag(instance),
};

DB.AssignedUsers.belongsTo(DB.Users, { foreignKey: "user_id" });
DB.AssignedUsers.belongsTo(DB.Tasks, { foreignKey: "task_id" });
DB.Users.hasMany(DB.AssignedUsers, { foreignKey: "user_id" });
DB.Tasks.hasMany(DB.AssignedUsers, { foreignKey: "task_id" });

export default DB;
