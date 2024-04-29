import { getServerSession } from "next-auth";
import "server-only";
import * as ynab from "ynab";
import {
  getLoggedInUser,
  connectUserWithYnab,
  UserType,
} from "../user/user.server";

const refreshAccessToken = async (refreshToken: string) => {
  // refresh using native fetch
  const clientId = process.env.YNAB_CLIENT_ID;
  const clientSecret = process.env.YNAB_CLIENT_SECRET;
  try {
    const response = await fetch(
      `https://app.ynab.com/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token&refresh_token=${refreshToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.json();
  } catch (exception) {
    console.error("error during refresh access token: " + exception);
    throw new Error("Failed to refresh token");
  }
};

export const refreshUserToken = async (user: UserType) => {
  const refreshToken = user.ynab?.connection?.refreshToken;
  if (!refreshToken) {
    throw new Error("No token found");
  }
  try {
    const refreshedToken = await refreshAccessToken(refreshToken);
    console.log("refreshed token:" + JSON.stringify(refreshedToken));
    await connectUserWithYnab(
      {
        accessToken: refreshedToken.access_token,
        refreshToken: refreshedToken.refresh_token,
      },
      user
    );
  } catch (exception) {
    throw new Error("Failed to refresh token:");
  }
};

const refreshLoggedInUserToken = async () => {
  const user = await getLoggedInUser();
  if (!user) {
    throw new Error("Not logged in");
  }
  await refreshUserToken(user);
};

export const isYnabTokenExpired = async () => {
  try {
    await refreshLoggedInUserToken();
    return false;
  } catch (exception) {
    return true;
  }
};

const getApi = async (userInput?: UserType) => {
  const user = userInput || (await getLoggedInUser());
  if (!user) {
    throw new Error("No user given or logged in");
  }
  const token = user?.ynab?.connection.accessToken;
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

export const getBudgets = async (
  user?: UserType
): Promise<ynab.BudgetDetail[]> => {
  try {
    const api = await getApi(user);
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
  user?: UserType;
};

const getTransactionsInternal = async ({
  budgetId,
  sinceDate,
  type,
  lastKnowledgeOfServer,
  user,
}: GetTransactionsInput): Promise<ynab.TransactionsResponseData> => {
  const api = await getApi(user);
  const { data } = await api.transactions.getTransactions(
    budgetId,
    sinceDate,
    type,
    lastKnowledgeOfServer
  );
  return sortMostRecentFirst(data);
};

export const getTransactions = async (
  budgetId: string,
  lastKnowledgeOfServer: number,
  user?: UserType
): Promise<ynab.TransactionsResponseData> => {
  return getTransactionsInternal({ budgetId, lastKnowledgeOfServer, user });
};

export const getUncategorizedOrUnApprovedTransactions = async (
  budgetId: string
): Promise<ynab.TransactionsResponseData> => {
  const api = await getApi();
  return getTransactionsInternal({ budgetId, type: "uncategorized" });
};

type CategoriesWithKnowledge = {
  knowledge: number;
  categories: Array<ynab.Category>;
};
export async function getCategories(
  budgetId: string,
  knowledge: number,
  user?: UserType
): Promise<CategoriesWithKnowledge> {
  const api = await getApi(user);
  const { data } = await api.categories.getCategories(budgetId, knowledge);
  const categories = data.category_groups.reduce(
    (acc: Array<ynab.Category>, group: ynab.CategoryGroupWithCategories) => {
      return acc.concat(group.categories);
    },
    []
  );
  return {
    knowledge: data.server_knowledge,
    categories,
  };
}
