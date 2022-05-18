import { Router } from "express";

import { get, add, update, remove } from "../controllers/projects.js";

const router = Router();

router.get("/", get);
router.post("/", add);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
