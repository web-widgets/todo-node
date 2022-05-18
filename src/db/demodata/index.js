import fs from "fs";
import DB from "../index.js";

export async function dataDown() {
  await DB.instance.query("SET FOREIGN_KEY_CHECKS = 0", null);
  await DB.Projects.destroy({ truncate: true });
  await DB.Users.destroy({ truncate: true });
  await DB.Tasks.destroy({ truncate: true });
  await DB.AssignedUsers.destroy({ truncate: true });
  await DB.Tags.destroy({ truncate: true });
  await DB.instance.query("SET FOREIGN_KEY_CHECKS = 1", null);
}

export async function dataUp() {
  await load("./src/db/demodata/projects.json", DB.Projects);
  await load("./src/db/demodata/users.json", DB.Users);
  await load("./src/db/demodata/tasks.json", DB.Tasks);
  await load("./src/db/demodata/assigned_users.json", DB.AssignedUsers);
  await load("./src/db/demodata/tags.json", DB.Tags);
}

async function load(path, model) {
  const data = readData(path);
  await model.bulkCreate(data);
}

function readData(path) {
  const data = fs.readFileSync(path);
  return JSON.parse(data);
}
