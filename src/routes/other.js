import { Router } from "express";

import { getTags } from "../controllers/tags.js";
import { clone, move } from "../controllers/tasks.js";

const router = Router();

router.get("/tags", getTags);
router.post("/clone", clone);
router.put("/move/:id", move);

export default router;
