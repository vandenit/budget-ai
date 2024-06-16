import "server-only";
import moment from "moment";
import * as budgetServer from "./budget/budget.server";
import { findTransactions } from "./transaction/transaction.server";
import { T } from "types-ramda";
import { monthSummaryReducer } from "./utils/month.summary.reducer";
import { categoryUsageReducer } from "./utils/category.usage.reducer";
import { categoryUsageMapper } from "./utils/category-usage.mapper";
import {
  Budget,
  Transaction,
  categorySorter,
  withoutInflowCategoryFilter,
  Category,
  MonthSummary,
  MonthTotal,
} from "common-ts";
import { getCategories } from "./category/category.server";
import { UserType } from "./user/user.server";

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

export const getFilteredTransactions = async (
  budgetId: string,
  month: string | null | undefined,
  dayOfMonth: string | null | undefined,
  user: UserType
): Promise<Array<Transaction>> => {
  console.log("getFilteredTransactionsInternal", budgetId, month, dayOfMonth);
  const transactions = await getTransactions(budgetId, user, month || "");
  return transactions.filter((transaction) => {
    const transactionDayOfMonth = transaction.date.substring(8, 10);
    return !dayOfMonth || Number(transactionDayOfMonth) === Number(dayOfMonth);
  });
};

export async function getTransactions(
  budgetUuid: string,
  user: UserType,
  month: string | null | undefined
): Promise<Array<Transaction>> {
  return await findTransactions(budgetUuid, user, month || "");
}

export async function getMonthSummaries(
  id: string,
  user: UserType
): Promise<Array<MonthSummary>> {
  const transactions = await getTransactions(id, user, null);

  return transactions.reduce(monthSummaryReducer, []);
}

// return all categories that have transactions
export const getCategoriesContainingTransactions = async (
  budgetUuid: string,
  transactions: Transaction[],
  user: UserType
) => {
  const categories = (await getCategories(budgetUuid, user)).filter(
    (category) =>
      transactions.find(
        (transaction) => transaction.categoryId === category.uuid
      )
  );
  return categories;
};

export const getCategoriesFromTransactions = async (
  budgetUuid: string,
  transactions: Transaction[],
  user: UserType
): Promise<Category[]> => {
  const budget = await budgetServer.getBudget(budgetUuid, user);
  if (!budget) {
    return [];
  }
  return transactions
    .reduce(categoryUsageReducer, [])
    .map(categoryUsageMapper(budget._id || ""))
    .sort(categorySorter);
};
