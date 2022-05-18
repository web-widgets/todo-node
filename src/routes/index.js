import { Router } from "express";

import tasks from "./tasks.js";
import projects from "./projects.js";
import users from "./users.js";
import other from "./other.js";

const router = Router();

router.use("/tasks", tasks);
router.use("/projects", projects);
router.use("/users", users);
router.use("/", other);

export default router;
