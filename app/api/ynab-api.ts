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
  data: ynab.TransactionsResponseData
): ynab.TransactionsResponseData => {
  return {
    ...data,
    transactions: data.transactions.sort((a, b) => {
      return a.date > b.date ? -1 : 1;
    }),
  };
};

type GetTransactionsInput = {
  budgetId: string;
  sinceDate?: string;
  type?: ynab.GetTransactionsTypeEnum;
  lastKnowledgeOfServer?: number;
};

const getTransactionsInternal = async ({
  budgetId,
  sinceDate,
  type,
  lastKnowledgeOfServer,
}: GetTransactionsInput): Promise<ynab.TransactionsResponseData> => {
  try {
    const api = await getApi();
    const { data } = await api.transactions.getTransactions(
      budgetId,
      sinceDate,
      type,
      lastKnowledgeOfServer
    );
    return sortMostRecentFirst(data);
  } catch (exception) {
    console.warn(exception);
    return { transactions: [], server_knowledge: 0 };
  }
};

export const getTransactions = async (
  budgetId: string,
  lastKnowledgeOfServer: number
): Promise<ynab.TransactionsResponseData> => {
  const api = await getApi();
  return getTransactionsInternal({ budgetId, lastKnowledgeOfServer });
};

export const getUncategorizedOrUnApprovedTransactions = async (
  budgetId: string
): Promise<ynab.TransactionsResponseData> => {
  const api = await getApi();
  return getTransactionsInternal({ budgetId, type: "uncategorized" });
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
