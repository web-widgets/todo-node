import MySqlDriver from "./mysql.js";
import SQLiteDriver from "./sqlite.js";

export default function getDriver(type) {
  switch (type) {
    case "mysql":
      return MySqlDriver;
    case "sqlite":
      return SQLiteDriver;
  }

  throw new Error("unknown database type: " + type);
}
