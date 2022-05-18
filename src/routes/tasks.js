import { Router } from "express";

import {
  getAll,
  getFromProject,
  add,
  update,
  remove,
} from "../controllers/tasks.js";

const router = Router();

router.get("/", getAll);
router.get("/projects/:id", getFromProject);
router.post("/", add);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
