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
