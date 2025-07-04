import { apiGet } from "./client";

export type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
  cleared_balance: number;
  uncleared_balance: number;
  closed: boolean;
  note?: string;
  on_budget: boolean;
  deleted: boolean;
};

/**
 * Get accounts for a budget from Node.js API
 */
export const getAccounts = async (budgetUuid: string): Promise<Account[]> => {
  return apiGet(`budgets/${budgetUuid}/accounts`);
};
