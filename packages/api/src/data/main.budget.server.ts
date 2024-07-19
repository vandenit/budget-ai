import moment from "moment";
import { findTransactions } from "./transaction/transaction.server";
import { monthSummaryFromCategoryHistoryReducer } from "./utils/month.summary.reducer";
import {
  Transaction,
  withoutInflowCategoryFilter,
  Category,
  MonthSummary,
  MonthTotal,
  BudgetOverview,
} from "common-ts";
import {
  findCategories,
  getCategoryHistoryForBudget,
} from "./category/category.server";
import { forecastSpendingWithES } from "./forecasting/es-forcasting.server";
import { cp } from "fs";

export const getBudgetOverviewForUser = async (
  budgetId: string
): Promise<BudgetOverview> => {
  const monthPercentage = calculateCurrentMontPercentage();
  const monthSummaries = await getMonthSummaries(budgetId);
  const categories = await findCategories(budgetId);
  const monthTotal = calculateTotals(categories);
  const forecast = forecastSpendingWithES(categories);

  return {
    monthPercentage,
    monthSummaries,
    categories,
    monthTotal,
    forecast,
  };
};

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
  dayOfMonth: string | null | undefined
): Promise<Array<Transaction>> => {
  console.log("getFilteredTransactionsInternal", budgetId, month, dayOfMonth);
  const transactions = await findTransactions(budgetId, month || "");
  const filteredTransactions = transactions.filter((transaction) => {
    const transactionDayOfMonth = transaction.date.substring(8, 10);
    return !dayOfMonth || Number(transactionDayOfMonth) === Number(dayOfMonth);
  });
  return filteredTransactions;
};

export async function getMonthSummaries(
  budgetId: string
): Promise<Array<MonthSummary>> {
  const categoryHistoryRecords = await getCategoryHistoryForBudget(budgetId);

  return categoryHistoryRecords.reduce(
    monthSummaryFromCategoryHistoryReducer,
    []
  );
}
