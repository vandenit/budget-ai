import "server-only";
import { cache } from "react";
import moment from "moment";
import * as ynabApi from "./ynab-api";
import { isInflowCategory } from "../utils/ynab";
import { BudgetDetail } from "ynab";
import {
  Transaction,
  findTransactions,
} from "./transaction/transaction.server";
import { T } from "types-ramda";
import { monthSummaryReducer } from "./utils/month.summary.reducer";
import { categoryUsageReducer } from "./utils/category.usage.reducer";
import { c } from "vitest/dist/reporters-5f784f42.js";
import { categoryUsageMapper } from "./utils/category-usage.mapper";

// todo : doesn't seem to be taken into account
export const revalidate = 3600; // revalidate the data at most every hour

export type Budget = {
  id: string;
  name: string;
};

export type MonthTotal = {
  totalSpent: number;
  totalBudgeted: number;
  totalBalance: number;
};

export type Category = {
  categoryName: string;
  categoryId: string;
  balance: number;
  budgeted: number;
  activity: number;
  targetAmount: number;
  budgetId: string;
};

export const emptyCategory: Category = {
  categoryName: "",
  categoryId: "",
  balance: 0,
  budgeted: 0,
  activity: 0,
  targetAmount: 0,
  budgetId: "",
};

export type CategoryUsage = {
  categoryName: string;
  categoryId: string | undefined | null;
  amount: number;
  transactions: Array<Transaction>;
};

export type MonthSummary = {
  month: string;
  isCurrentMonth: boolean;
  categoryUsages: Array<CategoryUsage>;
  overallTransactions: Array<Transaction>;
};

export async function getBudget(id: string): Promise<Budget> {
  try {
    const budget = await ynabApi.getBudget(id);
    return budget;
  } catch (exception) {
    console.warn(exception);
    return { id: "", name: "" };
  }
}

async function getBudgets(): Promise<Array<Budget>> {
  try {
    const budgets = await ynabApi.getBudgets();
    return budgets.map((budget) => ({
      id: budget.id,
      name: budget.name,
    }));
  } catch (exception) {
    console.warn(exception);
    return [];
  }
}

const categorySorter = (a: Category, b: Category): number =>
  a.categoryName.localeCompare(b.categoryName);

export const calculateCurrentMontPercentage = () => {
  const now = moment();
  const daysInMonth = now.daysInMonth();
  const currentDay = now.date();
  return (currentDay / daysInMonth) * 100;
};

const withoutInflowCategoryFilter = (category: Category) =>
  !isInflowCategory(category);

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
  id: string,
  month: string | null | undefined
): Promise<Array<Transaction>> {
  return await findTransactions(id, month || "");
}

export async function getMonthSummaries(
  id: string
): Promise<Array<MonthSummary>> {
  const transactions = await getTransactions(id, null);

  return transactions.reduce(monthSummaryReducer, []);
}

export async function getCategories(id: string): Promise<Array<Category>> {
  const categories = await ynabApi.getCategories(id);
  return categories
    .map((category) => ({
      categoryName: category.name,
      categoryId: category.id,
      balance: category.balance,
      budgeted: category.budgeted,
      activity: category.activity,
      targetAmount: category.goal_target || 0,
      budgetId: id,
    }))
    .sort(categorySorter);
}

// return all categories that have transactions
export const getCategoriesContainingTransactions = async (
  budgetId: string,
  transactions: Transaction[]
) => {
  const categories = (await getCategories(budgetId)).filter((category) =>
    transactions.find(
      (transaction) => transaction.categoryId === category.categoryId
    )
  );
  return categories;
};

export const getCategoriesFromTransactions = (
  budgetId: string,
  transactions: Transaction[]
): Category[] =>
  transactions
    .reduce(categoryUsageReducer, [])
    .map(categoryUsageMapper(budgetId))
    .sort(categorySorter);
