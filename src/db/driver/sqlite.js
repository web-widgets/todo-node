import { Sequelize } from "sequelize";

const SQLiteDriver = {};

SQLiteDriver.getConnection = function (cfg) {
  const instance = new Sequelize({
    dialect: "sqlite",
    storage: cfg.PATH,
    logging: false,
  });

  return instance;
};

SQLiteDriver.dataDown = async function (DB) {
  await DB.Projects.destroy({ truncate: true });
  await DB.Users.destroy({ truncate: true });
  await DB.Tasks.destroy({ truncate: true });
  await DB.AssignedUsers.destroy({ truncate: true });
  await DB.Tags.destroy({ truncate: true });
  await DB.instance.query(
    `DELETE FROM sqlite_sequence WHERE name IN (
      '${DB.Projects.tableName}', 
      '${DB.Users.tableName}', 
      '${DB.Tasks.tableName}', 
      '${DB.AssignedUsers.tableName}', 
      '${DB.Tags.tableName}'
    )`
  );
};

export default SQLiteDriver;
