import { Router } from "express";
import { handleSyncBudgetData } from "../controllers/syncController";
import { handleRequest } from "../controllers/utils";

const router = Router();

router.post("/", handleRequest(handleSyncBudgetData));

export default router;
