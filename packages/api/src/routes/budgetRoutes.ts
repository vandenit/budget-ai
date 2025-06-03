import { Router } from "express";
import {
  findBudgetsForUser,
  getBudgetForUser,
  handleGetBudgetOverviewForUser,
} from "../controllers/budgetController";
import { handleRequest } from "../controllers/utils";
import { getFilteredTransactionsWithCategories } from "../controllers/transactionController";
import {
  getUncategorizedTransactionsForBudget,
  getUnapprovedTransactionsForBudget,
  getCachedSuggestionsForBudget,
} from "../controllers/aiSuggestionsController";

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

// AI Suggestions endpoints (migrated from Python mathapi)
router.get(
  "/:uuid/uncategorized-transactions",
  handleRequest(getUncategorizedTransactionsForBudget)
);

router.get(
  "/:uuid/unapproved-transactions",
  handleRequest(getUnapprovedTransactionsForBudget)
);

router.get(
  "/:uuid/ai-suggestions/cached",
  handleRequest(getCachedSuggestionsForBudget)
);

export default router;
