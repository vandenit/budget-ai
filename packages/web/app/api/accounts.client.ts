import { apiGet } from "./client";

export type Account = {
  _id?: string;
  uuid: string;
  name: string;
  balance: number;
  cleared_balance: number;
  uncleared_balance: number;
  budgetId: string;
};

/**
 * Get accounts for a budget from Node.js API
 */
export const getAccounts = async (budgetUuid: string): Promise<Account[]> => {
  return apiGet(`budgets/${budgetUuid}/accounts`);
};
