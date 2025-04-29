import { apiPut, apiDelete } from './client';

export type ScheduledTransactionUpdate = {
    amount?: number;
    categoryId?: string;
    date?: string;
};

export const updateScheduledTransaction = async (
    budgetUuid: string,
    transactionId: string,
    updates: ScheduledTransactionUpdate
) => {
    return apiPut(`/scheduled-transactions/budgets/${budgetUuid}/scheduled-transactions/${transactionId}`, updates);
};

export const deleteScheduledTransaction = async (
    budgetUuid: string,
    transactionId: string
) => {
    return apiDelete(`/scheduled-transactions/budgets/${budgetUuid}/scheduled-transactions/${transactionId}`);
}; 