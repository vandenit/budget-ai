import { Router } from "express";
import {
  findBudgetsForUser,
  getBudgetForUser,
} from "../controllers/budgetController";
import { getBudget } from "../data/budget/budget.server";

const router = Router();
// get budgets
router.get("/", findBudgetsForUser);

// get budget by uuid
router.get("/:uuid", getBudgetForUser);

export default router;
