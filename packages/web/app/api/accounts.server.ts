"use server";
import { apiFetch } from "./client";

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
 * Get accounts for a budget from Node.js API (server-side)
 */
export const getAccounts = async (budgetUuid: string): Promise<Account[]> => {
  return apiFetch(`budgets/${budgetUuid}/accounts`);
};
