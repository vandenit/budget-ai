import { Router } from "express";
import { findBudgetsForUser } from "../controllers/budgetController";

const router = Router();
// get budgets
router.get("/", findBudgetsForUser);

export default router;
