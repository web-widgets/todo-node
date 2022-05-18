import { Sequelize } from "sequelize";

const MySqlDriver = {};

MySqlDriver.getConnection = function (cfg) {
  const instance = new Sequelize(cfg.DB, cfg.USER, cfg.PASS, {
    host: cfg.HOST,
    dialect: "mysql",
    logging: false,
  });

  return instance;
};

MySqlDriver.dataDown = async function (DB) {
  await DB.instance.query("SET FOREIGN_KEY_CHECKS = 0", null);
  await DB.Projects.destroy({ truncate: true });
  await DB.Users.destroy({ truncate: true });
  await DB.Tasks.destroy({ truncate: true });
  await DB.AssignedUsers.destroy({ truncate: true });
  await DB.Tags.destroy({ truncate: true });
  await DB.instance.query("SET FOREIGN_KEY_CHECKS = 1", null);
};

export default MySqlDriver;
