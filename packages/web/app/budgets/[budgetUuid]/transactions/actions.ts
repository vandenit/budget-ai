'use server';

import { revalidatePath } from "next/cache";
import { applySingleCategory } from '../../../api/math.server';

export interface CategoryUpdateResult {
  success: boolean;
  error?: string;
  transactionId?: string;
  categoryName?: string;
  message?: string;
}

export async function updateTransactionCategory(
  budgetId: string,
  transactionId: string,
  categoryName: string,
  isManualChange: boolean = true
): Promise<CategoryUpdateResult> {
  try {
    // Validate required fields
    if (!budgetId || !transactionId || !categoryName) {
      return {
        success: false,
        error: 'Missing required fields: budgetId, transactionId, categoryName'
      };
    }

    // Call the server-side function
    const result = await applySingleCategory(
      budgetId,
      transactionId,
      categoryName,
      isManualChange
    );

    if (result.success) {
      // Revalidate the transactions page to show updated data
      revalidatePath(`/budgets/${budgetId}/transactions`);
      
      return {
        success: true,
        transactionId,
        categoryName,
        message: result.message || `Applied '${categoryName}' to transaction`
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to update category'
      };
    }
  } catch (error) {
    console.error('Error updating transaction category:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    };
  }
}
