import { Request, Response } from "express";
import { getUserFromReq } from "./utils";
import { getBudget } from "../data/budget/budget.server";
import {
  getCachedAISuggestionsBatch,
  getAllCachedAISuggestionsForBudget,
} from "../data/transaction/transaction.server";
import {
  getUncategorizedTransactions as getYnabUncategorizedTransactions,
  getUnapprovedTransactions as getYnabUnapprovedTransactions,
} from "../data/ynab/ynab-api";

/**
 * Get uncategorized transactions for a budget via YNAB API
 * Migrated from Python mathapi: GET /uncategorised-transactions
 */
export const getUncategorizedTransactionsForBudget = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const budgetUuid = req.params.uuid;
    const budget = await getBudget(budgetUuid, user);
    if (!budget) {
      return res
        .status(404)
        .json({ error: "Budget not found or access denied" });
    }

    // Use YNAB API to get uncategorized transactions (like Python implementation)
    const transactions = await getYnabUncategorizedTransactions(
      budgetUuid,
      user
    );

    // Get cached AI suggestions for these transactions (like Python implementation)
    const transactionIds = transactions.map((tx) => tx.id);
    const cachedSuggestions = await getCachedAISuggestionsBatch(
      budget._id.toString(),
      transactionIds
    );

    // Transform to match Python API format with cached suggestions
    const formattedTransactions = transactions.map((transaction) => ({
      transaction_id: transaction.id,
      payee_name: transaction.payee_name || "",
      amount: transaction.amount,
      date: transaction.date,
      memo: transaction.memo || "",
      category_name: null,
      category_id: null,
      approved: transaction.approved || false,
      ai_suggested_category: cachedSuggestions[transaction.id] || null,
    }));

    console.log(
      `Returned ${formattedTransactions.length} uncategorized transactions for budget ${budgetUuid}`
    );
    res.json(formattedTransactions);
  } catch (error) {
    console.error("Error fetching uncategorized transactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get unapproved transactions for a budget via YNAB API
 * Migrated from Python mathapi: GET /unapproved-transactions
 */
export const getUnapprovedTransactionsForBudget = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const budgetUuid = req.params.uuid;
    const budget = await getBudget(budgetUuid, user);
    if (!budget) {
      return res
        .status(404)
        .json({ error: "Budget not found or access denied" });
    }

    // Use YNAB API to get unapproved transactions (like Python implementation)
    const transactions = await getYnabUnapprovedTransactions(budgetUuid, user);

    // Transform to match Python API format
    const formattedTransactions = transactions.map((transaction) => ({
      transaction_id: transaction.id,
      payee_name: transaction.payee_name || "",
      amount: transaction.amount,
      date: transaction.date,
      memo: transaction.memo || "",
      category_name: transaction.category_name || null,
      category_id: transaction.category_id || null,
      approved: transaction.approved || false,
    }));

    console.log(
      `Returned ${formattedTransactions.length} unapproved transactions for budget ${budgetUuid}`
    );
    res.json(formattedTransactions);
  } catch (error) {
    console.error("Error fetching unapproved transactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get cached AI suggestions for a budget
 * Migrated from Python mathapi: GET /uncategorised-transactions/suggestions-cached
 */
export const getCachedSuggestionsForBudget = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const budgetUuid = req.params.uuid;
    const budget = await getBudget(budgetUuid, user);
    if (!budget) {
      return res
        .status(404)
        .json({ error: "Budget not found or access denied" });
    }

    const suggestions = await getAllCachedAISuggestionsForBudget(
      budget._id.toString()
    );

    console.log(
      `Returned ${suggestions.length} cached suggestions for budget ${budgetUuid}`
    );
    res.json(suggestions);
  } catch (error) {
    console.error("Error fetching cached suggestions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
