import { Router } from "express";

import { get } from "../controllers/users.js";

const router = Router();

router.get("/", get);

export default router;
