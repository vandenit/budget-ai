import "server-only";
import { cache } from "react";
import moment from "moment";
import * as budgetServer from "./budget/budget.server";
import { findTransactions } from "./transaction/transaction.server";
import { T } from "types-ramda";
import { monthSummaryReducer } from "./utils/month.summary.reducer";
import { categoryUsageReducer } from "./utils/category.usage.reducer";
import { categoryUsageMapper } from "./utils/category-usage.mapper";
import { Budget } from "./budget/budget.utils";
import {
  categorySorter,
  withoutInflowCategoryFilter,
} from "./category/category.utils";
import { Transaction } from "./transaction/transaction.utils";
import { Category } from "./category/category.utils";
import { MonthSummary, MonthTotal } from "../main.budget.utils";
import { getCategories } from "./category/category.server";
import { UserType, getLoggedInUser } from "./user/user.server";

// todo : doesn't seem to be taken into account
export const revalidate = 3600; // revalidate the data at most every hour

export async function getBudget(
  uuid: string,
  user?: UserType
): Promise<Budget | null> {
  try {
    const finalUser = user || (await getLoggedInUser());
    if (!finalUser) {
      return null;
    }
    const budget = await budgetServer.getBudget(uuid, finalUser);
    return budget;
  } catch (exception) {
    console.warn(exception);
    return null;
  }
}

export async function getBudgets(): Promise<Array<Budget>> {
  try {
    const budgets = await budgetServer.findBudgets();
    return budgets.map((budget) => ({
      uuid: budget.uuid,
      name: budget.name,
    }));
  } catch (exception) {
    console.warn(exception);
    return [];
  }
}

export const calculateCurrentMontPercentage = () => {
  const now = moment();
  const daysInMonth = now.daysInMonth();
  const currentDay = now.date();
  return (currentDay / daysInMonth) * 100;
};

export const calculateTotals = (categories: Array<Category>): MonthTotal => {
  return categories.filter(withoutInflowCategoryFilter).reduce(
    (acc: MonthTotal, category: Category) => {
      if (category.activity < 0) {
        acc.totalSpent += category.activity;
      }
      acc.totalBudgeted += category.budgeted;
      acc.totalBalance += category.balance;
      return acc;
    },
    {
      totalSpent: 0,
      totalBudgeted: 0,
      totalBalance: 0,
    }
  );
};

export const getCachedBudgets = cache(getBudgets);

const getFilteredTransactionsInternal = async (
  budgetId: string,
  month: string | null | undefined,
  dayOfMonth: string | null | undefined
): Promise<Array<Transaction>> => {
  console.log("getFilteredTransactionsInternal", budgetId, month, dayOfMonth);
  const transactions = await getTransactions(budgetId, month || "");
  return transactions.filter((transaction) => {
    const transactionDayOfMonth = transaction.date.substring(8, 10);
    return !dayOfMonth || Number(transactionDayOfMonth) === Number(dayOfMonth);
  });
};

export const getFilteredTransactions = cache(getFilteredTransactionsInternal);

export async function getTransactions(
  budgetUuid: string,
  month: string | null | undefined
): Promise<Array<Transaction>> {
  return await findTransactions(budgetUuid, month || "");
}

export async function getMonthSummaries(
  id: string
): Promise<Array<MonthSummary>> {
  const transactions = await getTransactions(id, null);

  return transactions.reduce(monthSummaryReducer, []);
}

// return all categories that have transactions
export const getCategoriesContainingTransactions = async (
  budgetUuid: string,
  transactions: Transaction[]
) => {
  const categories = (await getCategories(budgetUuid)).filter((category) =>
    transactions.find((transaction) => transaction.categoryId === category.uuid)
  );
  return categories;
};

export const getCategoriesFromTransactions = async (
  budgetUuid: string,
  transactions: Transaction[]
): Promise<Category[]> => {
  const budget = await getBudget(budgetUuid);
  if (!budget) {
    return [];
  }
  return transactions
    .reduce(categoryUsageReducer, [])
    .map(categoryUsageMapper(budget._id || ""))
    .sort(categorySorter);
};
