"use client";

import { useState } from "react";
import { updateTransactionCategory } from "../budgets/[budgetUuid]/transactions/actions";

interface UseCategoryUpdateOptions {
  budgetId: string;
  onSuccess?: (transactionId: string, categoryName: string) => void;
  onError?: (error: Error) => void;
}

export const useCategoryUpdate = ({
  budgetId,
  onSuccess,
  onError,
}: UseCategoryUpdateOptions) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatingTransactionId, setUpdatingTransactionId] = useState<
    string | null
  >(null);

  const updateCategory = async (
    transactionId: string,
    categoryId: string,
    categoryName: string,
    isManualChange: boolean = true
  ) => {
    setIsUpdating(true);
    setUpdatingTransactionId(transactionId);

    try {
      // Call Server Action
      const result = await updateTransactionCategory(
        budgetId,
        transactionId,
        categoryName,
        isManualChange
      );

      if (result.success) {
        onSuccess?.(transactionId, categoryName);
        return result;
      } else {
        throw new Error(result.error ?? "Failed to update category");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      onError?.(new Error(errorMessage));
      throw error;
    } finally {
      setIsUpdating(false);
      setUpdatingTransactionId(null);
    }
  };

  return {
    updateCategory,
    isUpdating,
    updatingTransactionId,
    isUpdatingTransaction: (transactionId: string) =>
      updatingTransactionId === transactionId,
  };
};

export default useCategoryUpdate;
