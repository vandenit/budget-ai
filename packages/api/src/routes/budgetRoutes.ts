import { Router } from "express";
import {
  findBudgetsForUser,
  getBudgetForUser,
  handleGetBudgetOverviewForUser,
  getAccountsForBudget,
} from "../controllers/budgetController";
import { handleRequest } from "../controllers/utils";
import { getFilteredTransactionsWithCategories } from "../controllers/transactionController";
import {
  getUncategorizedTransactionsForBudget,
  getUnapprovedTransactionsForBudget,
  getCachedSuggestionsForBudget,
  suggestSingleTransaction,
  getSuggestionsAsync,
  applySingleCategory,
  approveSingleTransaction,
  approveAllTransactions,
  applyCategories,
  applyAllCategories,
  suggestCategoriesForUncategorized,
} from "../controllers/aiSuggestionsController";

const router = Router();
// get budgets
router.get("/", handleRequest(findBudgetsForUser));

// get budget by uuid
router.get("/:uuid", handleRequest(getBudgetForUser));

// budget data overview for user
router.get("/:uuid/overview", handleRequest(handleGetBudgetOverviewForUser));

// get accounts for a budget
router.get("/:uuid/accounts", handleRequest(getAccountsForBudget));

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

// Debug endpoint to test JSON parsing
router.post("/:uuid/debug-json", (req, res) => {
  console.log("🔍 Debug endpoint - req.body:", req.body);
  console.log("🔍 Debug endpoint - req.headers:", req.headers);
  console.log("🔍 Debug endpoint - content-type:", req.headers["content-type"]);
  res.json({
    received_body: req.body,
    body_keys: Object.keys(req.body || {}),
    content_type: req.headers["content-type"],
  });
});

// OpenAI-powered AI suggestion endpoints
router.post(
  "/:uuid/ai-suggestions/suggest-single",
  handleRequest(suggestSingleTransaction)
);

router.post(
  "/:uuid/ai-suggestions/suggestions-async",
  handleRequest(getSuggestionsAsync)
);

// Transaction categorization and approval endpoints
router.post(
  "/:uuid/ai-suggestions/apply-single",
  handleRequest(applySingleCategory)
);

router.post(
  "/:uuid/transactions/approve-single",
  handleRequest(approveSingleTransaction)
);

router.post(
  "/:uuid/transactions/approve-all",
  handleRequest(approveAllTransactions)
);

// Bulk categorization endpoints
router.post(
  "/:uuid/ai-suggestions/apply-categories",
  handleRequest(applyCategories)
);

router.post(
  "/:uuid/ai-suggestions/apply-all-categories",
  handleRequest(applyAllCategories)
);

// Batch suggestion endpoint
router.get(
  "/:uuid/ai-suggestions/suggest-categories",
  handleRequest(suggestCategoriesForUncategorized)
);

export default router;
