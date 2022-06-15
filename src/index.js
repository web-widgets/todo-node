import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import routes from "./routes/index.js";
import DB from "./db/index.js";
import { errorHandler } from "./helpers.js";
import { dataUp } from "./db/demodata/index.js";

const app = express();
app.use(morgan("tiny"));
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/", routes);
app.use(errorHandler);

dotenv.config();
const PORT = process.env.APP_SERVER_PORT || 3000;
const RESET_DATA = typeof process.env.APP_DB_RESETONSTART === "undefined" || process.env.APP_DB_RESETONSTART === "true";

(async () => {
  await DB.instance.sync();

  if (RESET_DATA) {
    await DB.driver.dataDown(DB);
    await dataUp();
  }

  app.listen(PORT, () => {
    console.log("ToDo backend is listening on port: " + PORT);
  });
})();
