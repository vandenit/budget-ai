import * as ynab from "ynab";
import { connectUserWithYnab, UserType } from "../user/user.server";

const YNAB_OAUTH_BASE_URL = "https://app.ynab.com/oauth";
const YNAB_API_BASE_URL = "https://api.ynab.com/v1";

const refreshAccessToken = async (refreshToken: string) => {
  // refresh using native fetch
  const clientId = process.env.YNAB_CLIENT_ID;
  const clientSecret = process.env.YNAB_CLIENT_SECRET;
  try {
    const response = await fetch(
      `${YNAB_OAUTH_BASE_URL}/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token&refresh_token=${refreshToken}`,
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

// todo move to client (stop using user client for connectUserWithYnab)
export const refreshUserToken = async (user: UserType) => {
  const refreshToken = user.ynab?.connection?.refreshToken;
  if (!refreshToken) {
    throw new Error("No token found");
  }
  try {
    const refreshedToken = await refreshAccessToken(refreshToken);
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

export const isYnabTokenExpired = async (user: UserType) => {
  try {
    await refreshUserToken(user);
    return false;
  } catch (exception) {
    return true;
  }
};

const getApi = async (user: UserType) => {
  const token = user?.ynab?.connection.accessToken;
  if (!token) {
    throw new Error("No token found");
  }
  return new ynab.api(token);
};

export const getBudget = async (
  id: string,
  user: UserType
): Promise<ynab.BudgetDetail> => {
  const emptyBudget = { id: "", name: "" };
  try {
    const api = await getApi(user);
    const { data } = await api.budgets.getBudgetById(id);
    return data?.budget || emptyBudget;
  } catch (exception) {
    console.warn(exception);
    return emptyBudget;
  }
};

export const getBudgets = async (
  user: UserType
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
  user: UserType;
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
  user: UserType
): Promise<ynab.TransactionsResponseData> => {
  return getTransactionsInternal({ budgetId, lastKnowledgeOfServer, user });
};

export const getUncategorizedOrUnApprovedTransactions = async (
  budgetId: string,
  user: UserType
): Promise<ynab.TransactionsResponseData> => {
  const api = await getApi(user);
  return getTransactionsInternal({ budgetId, type: "uncategorized", user });
};

type CategoriesWithKnowledge = {
  knowledge: number;
  categories: Array<ynab.Category>;
};

type AccountsWithKnowledge = {
  knowledge: number;
  accounts: Array<ynab.Account>;
};
export async function getCategories(
  budgetId: string,
  knowledge: number,
  user: UserType
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

export const getAccounts = async (
  budgetId: string,
  serverKnowledge: number,
  user: UserType
): Promise<AccountsWithKnowledge> => {
  const api = await getApi(user);
  console.log(
    "getting accounts for budgetId: " +
      budgetId +
      " and knowledge: " +
      serverKnowledge
  );
  const { data } = await api.accounts.getAccounts(budgetId, serverKnowledge);
  return {
    knowledge: data.server_knowledge,
    accounts: data.accounts,
  };
};

export const updateScheduledTransaction = async (
  budgetId: string,
  transactionId: string,
  data: {
    scheduled_transaction: {
      amount?: number;
      category_id?: string;
      date?: string;
    };
  },
  user: UserType
) => {
  const token = user?.ynab?.connection.accessToken;
  if (!token) {
    throw new Error("No token found");
  }

  // Custom REST call to update a scheduled transaction
  const url = `${YNAB_API_BASE_URL}/budgets/${budgetId}/scheduled_transactions/${transactionId}`;
  
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`YNAB API error: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating scheduled transaction:', error);
    throw error;
  }
};

export const deleteScheduledTransaction = async (
  budgetId: string,
  transactionId: string,
  user: UserType
) => {
  const token = user?.ynab?.connection.accessToken;
  if (!token) {
    throw new Error("No token found");
  }

  // Custom REST call to delete a scheduled transaction
  const url = `${YNAB_API_BASE_URL}/budgets/${budgetId}/scheduled_transactions/${transactionId}`;
  
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`YNAB API error: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting scheduled transaction:', error);
    throw error;
  }
};
