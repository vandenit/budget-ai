import "server-only";
import { apiGet, apiFetch } from "../client";
import { TransactionsWithCategories } from "common-ts";

export const getFilteredTransactionsWithCategories = async (
  budgetUuid: string,
  month?: string,
  dayOfMonth?: string
): Promise<TransactionsWithCategories> =>
  apiGet(
    `budgets/${budgetUuid}/transactions?month=${
      month ? month : ""
    }&dayOfMonth=${dayOfMonth ? dayOfMonth : ""}`
  );

/**
 * Approve a single transaction
 */
export const approveSingleTransaction = async (
  budgetId: string,
  transactionId: string
) => {
  return apiFetch(`budgets/${budgetId}/transactions/approve-single`, {
    method: "POST",
    body: JSON.stringify({ transaction_id: transactionId }),
    headers: {
      "Content-Type": "application/json",
    },
  });
};

/**
 * Approve all unapproved transactions
 */
export const approveAllTransactions = async (budgetId: string) => {
  return apiFetch(`budgets/${budgetId}/transactions/approve-all`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
};
