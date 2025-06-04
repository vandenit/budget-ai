"use server";
import { apiFetch } from "./client";

/**
 * Get uncategorized transactions from Node.js API
 */
export const getUncategorizedTransactions = async (budgetId: string) => {
  return apiFetch(`budgets/${budgetId}/uncategorized-transactions`);
};

/**
 * Get unapproved transactions from Node.js API
 */
export const getUnapprovedTransactions = async (budgetId: string) => {
  return apiFetch(`budgets/${budgetId}/unapproved-transactions`);
};

/**
 * Get cached AI suggestions from Node.js API
 */
export const getCachedSuggestions = async (budgetId: string) => {
  return apiFetch(`budgets/${budgetId}/ai-suggestions/cached`);
};

/**
 * Get AI suggestions for specific transactions (progressive loading)
 */
export const getSuggestionsAsync = async (
  budgetId: string,
  transactionIds: string[]
) => {
  return apiFetch(`budgets/${budgetId}/ai-suggestions/suggestions-async`, {
    method: "POST",
    body: JSON.stringify({
      transaction_ids: transactionIds,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
};

/**
 * Get AI suggestion for a single transaction
 */
export const getSingleSuggestion = async (
  budgetId: string,
  transactionId: string,
  transaction?: any
) => {
  const body: any = { transaction_id: transactionId };
  if (transaction) {
    body.transaction = transaction;
  }

  return apiFetch(`budgets/${budgetId}/ai-suggestions/suggest-single`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
};

/**
 * Suggest categories for all uncategorized transactions
 */
export const suggestCategories = async (budgetId: string) =>
  apiFetch(`budgets/${budgetId}/ai-suggestions/suggest-categories`);

/**
 * Apply category for a single transaction
 */
export const applySingleCategory = async (
  budgetId: string,
  transactionId: string,
  categoryName: string,
  isManualChange: boolean = false
) => {
  return apiFetch(`budgets/${budgetId}/ai-suggestions/apply-single`, {
    method: "POST",
    body: JSON.stringify({
      transaction_id: transactionId,
      category_name: categoryName,
      is_manual_change: isManualChange,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
};

/**
 * Apply categories for multiple transactions
 */
export const applyCategories = async (budgetId: string, transactions: any[]) =>
  apiFetch(`budgets/${budgetId}/ai-suggestions/apply-categories`, {
    method: "POST",
    body: JSON.stringify({ transactions }),
    headers: {
      "Content-Type": "application/json",
    },
  });

/**
 * Apply all categories for uncategorized transactions
 */
export const applyAllCategories = async (budgetId: string) =>
  apiFetch(`budgets/${budgetId}/ai-suggestions/apply-all-categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
