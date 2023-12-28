import { cache } from "react";
import moment from "moment";
import * as ynabApi from "./ynab-api";
import { isInflowCategory } from "../utils/ynab";
import { BudgetDetail } from "ynab";

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
export type Transaction = {
  id: string;
  accountName: string;
  amount: number;
  date: string;
  categoryName: string;
  categoryId: string | undefined | null;
  payeeName: string;
  memo: string;
};

export type CategoryUsage = {
  category: string;
  categoryId: string | undefined | null;
  amount: number;
  transactions: Array<Transaction>;
};

export type MonthSummary = {
  month: string;
  isCurrentMonth: boolean;
  categoryUsage: Array<CategoryUsage>;
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

export async function getFilteredTransactions(
  budgetId: string,
  categoryId: string | null | undefined,
  month: string | null | undefined,
  dayOfMonth: string | null | undefined
): Promise<Array<Transaction>> {
  const transactions = await getTransactions(budgetId);
  return transactions.filter((transaction) => {
    const transactionMonth = transaction.date.substring(0, 7);
    const transactionDayOfMonth = transaction.date.substring(8, 10);
    return (
      (!month || transactionMonth === month) &&
      (!dayOfMonth || Number(transactionDayOfMonth) === Number(dayOfMonth)) &&
      (!categoryId || transaction.categoryId === categoryId)
    );
  });
}
export async function getTransactions(id: string): Promise<Array<Transaction>> {
  const transactions = await ynabApi.getTransactions(id);
  return transactions.map((transaction) => ({
    id: transaction.id,
    accountName: transaction.account_name,
    payeeName: transaction.payee_name || "",
    amount: transaction.amount,
    date: transaction.date,
    categoryId: transaction.category_id,
    categoryName: transaction.category_name || "Uncategorized",
    memo: transaction.memo || "",
  }));
}

export async function getMonthSummaries(
  id: string
): Promise<Array<MonthSummary>> {
  const transactions = await getTransactions(id);

  return transactions.reduce(monthSummaryReducer, []);
}

export const monthSummaryReducer = (
  acc: Array<MonthSummary>,
  transaction: Transaction
) => {
  const month = transaction.date.substring(0, 7);
  const currentMonth = new Date().toISOString().substring(0, 7);
  const monthSummary = acc.find(
    (summary: MonthSummary) => summary.month === month
  );

  if (monthSummary) {
    const categoryUsage = monthSummary.categoryUsage.find(
      (usage: CategoryUsage) => usage.category === transaction.categoryName
    );

    if (categoryUsage) {
      categoryUsage.amount += transaction.amount;
      categoryUsage.transactions.push(transaction);
    } else {
      monthSummary.categoryUsage.push({
        category: transaction.categoryName,
        amount: transaction.amount,
        categoryId: transaction.categoryId,
        transactions: [transaction],
      });
    }
    monthSummary.overallTransactions.push(transaction);
  } else {
    acc.push({
      month,
      isCurrentMonth: month === currentMonth,
      categoryUsage: [
        {
          category: transaction.categoryName,
          amount: transaction.amount,
          categoryId: transaction.categoryId,
          transactions: [transaction],
        },
      ],
      overallTransactions: [transaction],
    });
  }
  return acc;
};

export async function getCategories(id: string): Promise<Array<Category>> {
  const categories = await ynabApi.getCategories(id);
  return categories.map((category) => ({
    categoryName: category.name,
    categoryId: category.id,
    balance: category.balance,
    budgeted: category.budgeted,
    activity: category.activity,
    targetAmount: category.goal_target || 0,
    budgetId: id,
  }));
}
