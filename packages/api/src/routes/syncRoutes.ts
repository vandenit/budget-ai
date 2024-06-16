import { Router } from "express";
import { handleSyncBudgetData } from "../controllers/syncController";

const router = Router();

router.post("/", handleSyncBudgetData);

export default router;
