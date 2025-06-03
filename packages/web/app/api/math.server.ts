import { getToken, apiFetch } from "./client";
import { handleServerApiResponse } from "./utils.server";

const mathApiFetch = async (
  path: string,
  options: RequestInit = {},
  accesToken?: string
) => {
  try {
    const token = await getToken(accesToken);
    const apiBaseUrl = process.env.MATH_API_URL || "http://localhost:5000";
    const apiUrl = new URL(path, apiBaseUrl).toString();
    const response = await fetch(apiUrl, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Math API error! status: ${response.status}, message: ${errorText}`
      );
    }

    return handleServerApiResponse(apiUrl, response);
  } catch (error) {
    console.error(`Error calling math API ${path}:`, error);
    throw error;
  }
};

export const getPrediction = async (
  budgetId: string,
  daysAhead: number = 180
) =>
  mathApiFetch(
    `balance-prediction/data?budget_id=${budgetId}&days_ahead=${daysAhead}`
  );

// These endpoints have been migrated to Node.js API
// Import from respective client modules instead
export {
  getUncategorizedTransactions as getUncategorisedTransactions,
  getUnapprovedTransactions,
  getCachedSuggestions,
} from "./ai-suggestions.server";

export { getScheduledTransactions } from "./scheduledTransactions.client";

// These endpoints have been migrated to Node.js API
export const getSuggestionsAsync = async (
  budgetId: string,
  transactionIds: string[]
) => {
  return apiFetch(`budgets/${budgetId}/ai-suggestions/suggestions-async`, {
    method: "POST",
    body: JSON.stringify({
      transaction_ids: transactionIds,
    }),
  });
};

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
  });
};

// Migrated to Node.js API
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
  });
};

// Migrated to Node.js API
export const suggestCategories = async (budgetId: string) =>
  apiFetch(`budgets/${budgetId}/ai-suggestions/suggest-categories`);

// Migrated to Node.js API
export const applyCategories = async (budgetId: string, transactions: any[]) =>
  apiFetch(`budgets/${budgetId}/ai-suggestions/apply-categories`, {
    method: "POST",
    body: JSON.stringify({ transactions }),
  });

export const applyAllCategories = async (budgetId: string) =>
  apiFetch(`budgets/${budgetId}/ai-suggestions/apply-all-categories`, {
    method: "POST",
  });

// Migrated to Node.js API
export const approveSingleTransaction = async (
  budgetId: string,
  transactionId: string
) => {
  return apiFetch(`budgets/${budgetId}/transactions/approve-single`, {
    method: "POST",
    body: JSON.stringify({ transaction_id: transactionId }),
  });
};

export const approveAllTransactions = async (budgetId: string) => {
  return apiFetch(`budgets/${budgetId}/transactions/approve-all`, {
    method: "POST",
  });
};
