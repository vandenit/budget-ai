import { cache } from "react";
import moment from "moment";
import "server-only";
import * as ynab from "ynab";

import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]/route";
import { isInflowCategory } from "../utils/ynab";

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

const getToken = async () => {
  const session = await getServerSession(authOptions);
  if (session) {
    return (session as any).token;
  }
};

async function getBudgets(): Promise<Array<Budget>> {
  const token = await getToken();
  if (!token) {
    return [];
  }
  const api = new ynab.api(token || "");
  try {
    const budgets = await api.budgets.getBudgets();
    return budgets.data.budgets.map((budget: ynab.BudgetDetail) => ({
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
  const token = await getToken();
  if (!token) {
    return [];
  }
  const api = new ynab.api(token || "");
  try {
    const { data } = await api.transactions.getTransactions(id);

    return sortMostRecentFirst(data.transactions).map(
      (transaction: ynab.TransactionDetail) => ({
        id: transaction.id,
        accountName: transaction.account_name,
        payeeName: transaction.payee_name || "",
        amount: transaction.amount,
        date: transaction.date,
        categoryId: transaction.category_id,
        categoryName: transaction.category_name || "Uncategorized",
      })
    );
  } catch (exception) {
    console.warn(exception);
    return [];
  }
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

const sortMostRecentFirst = (
  transactions: Array<ynab.TransactionDetail>
): Array<ynab.TransactionDetail> =>
  transactions.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

export async function getCategories(id: string): Promise<Array<Category>> {
  const token = await getToken();
  if (!token) {
    return [];
  }
  const api = new ynab.api(token || "");
  try {
    const { data } = await api.categories.getCategories(id);
    const categories = data.category_groups.reduce(
      (acc: Array<ynab.Category>, group: ynab.CategoryGroupWithCategories) => {
        return acc.concat(group.categories);
      },
      []
    );

    return categories.map((category: ynab.Category) => ({
      categoryName: category.name,
      categoryId: category.id,
      balance: category.balance,
      budgeted: category.budgeted,
      activity: category.activity,
      targetAmount: category.goal_target || 0,
      budgetId: id,
    }));
  } catch (exception) {
    console.warn(exception);
    return [];
  }
}
