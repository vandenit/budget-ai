import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]/route";
import "server-only";
import * as ynab from "ynab";
import { get } from "http";

const getToken = async () => {
  const session = await getServerSession(authOptions);
  if (session) {
    return (session as any).token;
  }
};

const getApi = async (t?: string) => {
  const token = t || (await getToken());
  if (!token) {
    throw new Error("No token found");
  }
  return new ynab.api(token);
};

export const getBudget = async (id: string): Promise<ynab.BudgetDetail> => {
  const emptyBudget = { id: "", name: "" };
  try {
    const api = await getApi();
    const { data } = await api.budgets.getBudgetById(id);
    return data?.budget || emptyBudget;
  } catch (exception) {
    console.warn(exception);
    return emptyBudget;
  }
};

export const getBudgets = async (): Promise<ynab.BudgetDetail[]> => {
  try {
    const api = await getApi();
    const budgets = await api.budgets.getBudgets();
    return budgets.data.budgets;
  } catch (exception) {
    console.warn(exception);
    return [];
  }
};

const sortMostRecentFirst = (
  transactions: Array<ynab.TransactionDetail>
): Array<ynab.TransactionDetail> =>
  transactions.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

export const getTransactions = async (
  id: string
): Promise<ynab.TransactionDetail[]> => {
  try {
    const api = await getApi();
    const { data } = await api.transactions.getTransactions(id);
    return sortMostRecentFirst(data.transactions);
  } catch (exception) {
    console.warn(exception);
    return [];
  }
};

export async function getCategories(id: string): Promise<Array<ynab.Category>> {
  try {
    const api = await getApi();
    const { data } = await api.categories.getCategories(id);
    const categories = data.category_groups.reduce(
      (acc: Array<ynab.Category>, group: ynab.CategoryGroupWithCategories) => {
        return acc.concat(group.categories);
      },
      []
    );
    return categories;
  } catch (exception) {
    console.warn(exception);
    return [];
  }
}

export const getLoggedInUserAuthId = async (
  token?: string
): Promise<string> => {
  try {
    const api = await getApi(token);
    const { data } = await api.user.getUser();
    return data?.user?.id || "";
  } catch (exception) {
    return "";
  }
};
