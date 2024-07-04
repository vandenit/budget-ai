import { Router } from "express";
import {
  findBudgetsForUser,
  getBudgetForUser,
  handleGetBudgetOverviewForUser,
} from "../controllers/budgetController";
import { handleRequest } from "../controllers/utils";
import { getFilteredTransactionsWithCategories } from "../controllers/transactionController";

const router = Router();
// get budgets
router.get("/", handleRequest(findBudgetsForUser));

// get budget by uuid
router.get("/:uuid", handleRequest(getBudgetForUser));

// budget data overview for user
router.get("/:uuid/overview", handleRequest(handleGetBudgetOverviewForUser));

router.get(
  "/:uuid/transactions",
  handleRequest(getFilteredTransactionsWithCategories)
);

export default router;
