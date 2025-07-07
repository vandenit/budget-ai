"use server";

import { revalidatePath } from "next/cache";
import {
  applyCategories as applyCategoriesApi,
  applyAllCategories as applyAllCategoriesApi,
  getSuggestionsAsync as getSuggestionsAsyncApi,
  getSingleSuggestion as getSingleSuggestionApi,
  applySingleCategory as applySingleCategoryApi,
  getUnapprovedTransactions as getUnapprovedTransactionsApi,
} from "../../../api/ai-suggestions.server";

import {
  approveSingleTransaction as approveSingleTransactionApi,
  approveAllTransactions as approveAllTransactionsApi,
} from "../../../api/transaction/transaction.client";

export async function applyCategories(budgetId: string, transactions: any[]) {
  try {
    const result = await applyCategoriesApi(budgetId, transactions);

    // Invalidate the cache for the uncategorised page
    revalidatePath(`/budgets/${budgetId}/uncategorised`);

    return result;
  } catch (error) {
    console.error("Error applying categories:", error);
    throw error;
  }
}

export async function applyAllCategories(budgetId: string) {
  try {
    const result = await applyAllCategoriesApi(budgetId);

    // Invalidate the cache for the uncategorised page
    revalidatePath(`/budgets/${budgetId}/uncategorised`);

    return result;
  } catch (error) {
    console.error("Error applying all categories:", error);
    throw error;
  }
}

export async function getSuggestionsAsync(
  budgetId: string,
  transactionIds: string[]
) {
  try {
    return await getSuggestionsAsyncApi(budgetId, transactionIds);
  } catch (error) {
    console.error("Error getting async suggestions:", error);
    throw error;
  }
}

export async function getSingleSuggestion(
  budgetId: string,
  transactionId: string,
  transaction?: any
) {
  try {
    return await getSingleSuggestionApi(budgetId, transactionId, transaction);
  } catch (error) {
    console.error("Error getting single suggestion:", error);
    throw error;
  }
}

export async function applySingleCategory(
  budgetId: string,
  transactionId: string,
  categoryName: string,
  isManualChange: boolean = false
) {
  try {
    const result = await applySingleCategoryApi(
      budgetId,
      transactionId,
      categoryName,
      isManualChange
    );

    // Invalidate the cache for the uncategorised page
    revalidatePath(`/budgets/${budgetId}/uncategorised`);

    return result;
  } catch (error) {
    console.error("Error applying single category:", error);
    throw error;
  }
}

export async function approveSingleTransaction(
  budgetId: string,
  transactionId: string
) {
  try {
    const result = await approveSingleTransactionApi(budgetId, transactionId);

    // Invalidate the cache for the uncategorised page
    revalidatePath(`/budgets/${budgetId}/uncategorised`);

    return result;
  } catch (error) {
    console.error("Error approving single transaction:", error);
    throw error;
  }
}

export async function approveAllTransactions(budgetId: string) {
  try {
    const result = await approveAllTransactionsApi(budgetId);

    // Invalidate the cache for the uncategorised page
    revalidatePath(`/budgets/${budgetId}/uncategorised`);

    return result;
  } catch (error) {
    console.error("Error approving all transactions:", error);
    throw error;
  }
}

export async function getUnapprovedTransactions(budgetId: string) {
  try {
    return await getUnapprovedTransactionsApi(budgetId);
  } catch (error) {
    console.error("Error getting unapproved transactions:", error);
    throw error;
  }
}
