import dotenv from "dotenv";

dotenv.config();

const config = {
  TYPE: process.env.APP_DB_TYPE || "sqlite",
  PATH: process.env.APP_DB_PATH || "./db.sqlite",
  HOST: process.env.APP_DB_HOST,
  USER: process.env.APP_DB_USER,
  PASS: process.env.APP_DB_PASSWORD,
  DB: process.env.APP_DB_DATABASE,
  dialect: "mysql",
};

export default config;
