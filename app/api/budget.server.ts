import { cache } from "react";
import "server-only";
import * as ynab from "ynab";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]/route";

// todo : doesn't seem to be taken into account
export const revalidate = 3600; // revalidate the data at most every hour

export type Budget = {
  id: string;
  name: string;
};

export type Category = {
  categoryName: string;
  categoryId: string;
  balance: number;
  budgeted: number;
  activity: number;
};

export const emptyCategory: Category = {
  categoryName: "",
  categoryId: "",
  balance: 0,
  budgeted: 0,
  activity: 0,
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
};

export type MonthSummary = {
  month: string;
  isCurrentMonth: boolean;
  categoryUsage: Array<CategoryUsage>;
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
    console.log("getting budgets");
    return budgets.data.budgets.map((budget: ynab.BudgetDetail) => ({
      id: budget.id,
      name: budget.name,
    }));
  } catch (exception) {
    console.warn(exception);
    return [];
  }
}

export const getCachedBudgets = cache(getBudgets);

export async function getFilteredTransactions(
  budgetId: string,
  categoryId: string | null | undefined,
  month: string | null | undefined
): Promise<Array<Transaction>> {
  const transactions = await getTransactions(budgetId);
  return transactions.filter((transaction) => {
    const transactionMonth = transaction.date.substring(0, 7);

    if (month && categoryId) {
      return (
        transactionMonth === month && transaction.categoryId === categoryId
      );
    }
    if (month) {
      return transactionMonth === month;
    }
    if (categoryId) {
      return transaction.categoryId === categoryId;
    }
    return true;
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
        payeeName: transaction.payee_name || '',
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
    } else {
      monthSummary.categoryUsage.push({
        category: transaction.categoryName,
        amount: transaction.amount,
        categoryId: transaction.categoryId,
      });
    }
  } else {
    acc.push({
      month,
      isCurrentMonth: month === currentMonth,
      categoryUsage: [
        {
          category: transaction.categoryName,
          amount: transaction.amount,
          categoryId: transaction.categoryId,
        },
      ],
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
    }));
  } catch (exception) {
    console.warn(exception);
    return [];
  }
}
