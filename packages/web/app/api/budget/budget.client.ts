import { getSession } from "@auth0/nextjs-auth0";
import { Budget, BudgetOverview } from "common-ts";
import { cache } from "react";
import { apiGet } from "../client";

export const findBudgetsInternal = async (): Promise<Budget[]> =>
  apiGet("budgets");

const getBudgetInternal = async (uuid: string): Promise<Budget> =>
  apiGet(`budgets/${uuid}`);

export const getBudget = cache(getBudgetInternal);

export const findBudgets = cache(findBudgetsInternal);

export const getBudgetOverviewForUser = async (
  uuid: string
): Promise<BudgetOverview> => {
  return apiGet(`budgets/${uuid}/overview`);
};
