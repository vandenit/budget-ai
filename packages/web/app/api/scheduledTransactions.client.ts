import { apiGet, apiPut, apiDelete } from "./client";

export type ScheduledTransactionUpdate = {
  amount?: number;
  categoryId?: string;
  date?: string;
};

/**
 * Get scheduled transactions for a budget from Node.js API
 */
export const getScheduledTransactions = async (budgetUuid: string) => {
  return apiGet(`budgets/${budgetUuid}/scheduled-transactions`);
};

export const updateScheduledTransaction = async (
  budgetUuid: string,
  transactionId: string,
  updates: ScheduledTransactionUpdate
) => {
  return apiPut(
    `budgets/${budgetUuid}/scheduled-transactions/${transactionId}`,
    updates
  );
};

export const deleteScheduledTransaction = async (
  budgetUuid: string,
  transactionId: string
) => {
  return apiDelete(
    `budgets/${budgetUuid}/scheduled-transactions/${transactionId}`
  );
};
