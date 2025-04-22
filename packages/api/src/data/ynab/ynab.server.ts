import { T, update } from "ramda";
import * as ynab from "ynab";
import {
  findBudgets,
  getBudgetWithoutUserCheck,
  saveNewBudget,
  updateBudget,
} from "../budget/budget.server";
import { UserType, clearYnabConnection } from "../user/user.server";
import * as ynabApi from "./ynab-api"; // Import the missing ynapApi module
import {
  deleteCategory,
  findCategories,
  getCategory,
  saveNewCategory,
  updateCategory,
} from "../category/category.server";
import { Budget, Category, CategoryTarget } from "common-ts";
import YnabBudget from "./ynab.schema";
import { updateTransactionsSpendingPattern } from "../forecasting/es-forcasting.server";
import { extractYearsFromTransactions } from "./transaction.util";
import { NewOrUpdatedTransaction } from "../transaction/transaction.server";
import * as transactionServer from "../transaction/transaction.server";
import {
  deleteAccount,
  getAccount,
  saveNewAccount,
  updateAccount,
} from "../accounts/account.server";
import { LocalAccountType } from "../accounts/account.schema";

type ServerKnowledge = {
  transactions: number;
  categories: number;
  accounts: number;
};

export const emptyServerKnowledge: ServerKnowledge = {
  transactions: 0,
  categories: 0,
  accounts: 0,
};

type YnabBudgetType = {
  serverKnowledge: ServerKnowledge;
};

const insertOrUpdateMissingTransaction = async (
  ynabTransaction: ynab.TransactionDetail,
  categories: Category[],
  budgetId: string
) => {
  const categoryId = categories.find(
    (category) => category.uuid === ynabTransaction.category_id
  )?._id;
  const newData: NewOrUpdatedTransaction = {
    accountName: ynabTransaction.account_name,
    amount: ynabTransaction.amount,
    date: ynabTransaction.date,
    categoryId,
    payeeName: ynabTransaction.payee_name,
    memo: ynabTransaction.memo,
  };
  await transactionServer.insertOrUpdateMissingTransaction(
    ynabTransaction.id,
    ynabTransaction.deleted,
    budgetId,
    newData
  );
};

const transactionToInsertOrUpdatePromise =
  (budgetId: string, categories: Category[]) =>
  (transaction: ynab.TransactionDetail) =>
    insertOrUpdateMissingTransaction(transaction, categories, budgetId);

const insertOrUpdateMissingTransactions = async (
  budgetId: string,
  transactions: ynab.TransactionDetail[]
) => {
  try {
    console.log(
      `insert or update ${transactions.length} number of transactions`
    );
    const categories = await findCategories(budgetId);
    const promiseMapper = transactionToInsertOrUpdatePromise(
      budgetId,
      categories
    );
    await Promise.all(transactions.map(promiseMapper));
    if (transactions.length > 0) {
      const years = extractYearsFromTransactions(transactions);
      await Promise.all(
        years.map((year) => updateTransactionsSpendingPattern(budgetId, year))
      );
    }
  } catch (exception) {
    console.error(
      `Error while inserting or updating transactions: ${exception}`
    );
    throw new Error("Error while inserting or updating transactions");
  }
};

const updateUserServerKnowledge = async ({
  user,
  budget,
  type,
  knowledge,
}: {
  user: UserType;
  budget: Budget;
  type: "transactions" | "categories" | "accounts";
  knowledge: number;
}) => {
  console.log("updateUserServerKnowledge:", budget.name, type, knowledge);
  const ynabBudget = await YnabBudget.findOne({
    budgetId: budget._id,
    userId: user._id,
  });
  if (!ynabBudget) {
    const newYnabBudget = new YnabBudget({
      userId: user._id,
      budgetId: budget._id,
      serverKnowledge: {
        [type]: knowledge,
      },
    });
    await newYnabBudget.save();
    return;
  }
  const newServerKnowledge = {
    ...ynabBudget.serverKnowledge,
    [type]: knowledge,
  };
  await YnabBudget.updateOne(
    { _id: ynabBudget._id },
    { serverKnowledge: newServerKnowledge }
  ).exec();
};

const findYnabBudget = async (
  user: UserType,
  budget: Budget
): Promise<YnabBudgetType> => {
  const budgetData = await YnabBudget.findOne({
    budgetId: budget._id,
    userId: user._id,
  });
  return !budgetData
    ? { serverKnowledge: emptyServerKnowledge }
    : {
        serverKnowledge: {
          transactions: budgetData.serverKnowledge.transactions || 0,
          categories: budgetData.serverKnowledge.categories || 0,
          accounts: budgetData.serverKnowledge.accounts || 0,
        },
      };
};

const syncTransactions = async (user: UserType, budget: Budget) => {
  const ynabBudget = await findYnabBudget(user, budget);
  const ynabTransactions = await ynabApi.getTransactions(
    budget.uuid,
    ynabBudget.serverKnowledge.transactions,
    user
  );
  await insertOrUpdateMissingTransactions(
    budget._id || "",
    ynabTransactions.transactions
  );
  await updateUserServerKnowledge({
    user,
    budget,
    type: "transactions",
    knowledge: ynabTransactions.server_knowledge,
  });
};

const syncYnabBudget = async (
  user: UserType,
  ynabBudget: ynab.BudgetDetail
) => {
  console.log(
    `syncing budget with id: ${ynabBudget.id} and name: ${ynabBudget.name}`
  );
  const localBudget = await getBudgetWithoutUserCheck(ynabBudget.id);
  if (!localBudget) {
    await saveNewBudget(
      {
        uuid: ynabBudget.id,
        name: ynabBudget.name,
      },
      user
    );
  } else {
    await updateBudget(ynabBudget.id, ynabBudget.name, user);
  }
};

const syncBudgets = async (user: UserType) => {
  const ynabBudgets = await ynabApi.getBudgets(user);
  const promises = ynabBudgets.map((ynabBudget) =>
    syncYnabBudget(user, ynabBudget)
  );
  await Promise.all(promises);
};

const syncYnabCategory = async (
  ynabCategory: ynab.Category,
  budget: Budget
) => {
  if (ynabCategory.deleted) {
    await deleteCategory(ynabCategory.id);
    return;
  }
  const localCategory = await getCategory(ynabCategory.id);
  if (!localCategory) {
    await saveNewCategory(mapCategory(ynabCategory, budget));
  } else {
    await updateCategory(mapCategory(ynabCategory, budget, localCategory._id));
  }
};
const syncYnabCategories = async (user: UserType, budget: Budget) => {
  const ynabBudget = await findYnabBudget(user, budget);
  const ynabCategoriesData = await ynabApi.getCategories(
    budget.uuid,
    ynabBudget.serverKnowledge.categories,
    user
  );
  const promises = ynabCategoriesData.categories.map((ynabCategory) =>
    syncYnabCategory(ynabCategory, budget)
  );
  await Promise.all(promises);
  // for now set knowledge to 0 to have the latest categories all the time (keeps
  // we noticed otherwise that properties as activity, balance are not updated correctly)
  await updateUserServerKnowledge({
    user,
    budget,
    type: "categories",
    knowledge: 0,
  });
};

const mapAccount = (
  ynabAccount: ynab.Account,
  budget: Budget,
  _id?: string
): LocalAccountType => ({
  uuid: ynabAccount.id,
  name: ynabAccount.name,
  balance: ynabAccount.balance,
  cleared_balance: ynabAccount.cleared_balance,
  uncleared_balance: ynabAccount.uncleared_balance,
  budgetId: budget._id || "",
  _id,
});

const syncYnabAccount = async (ynabAccount: ynab.Account, budget: Budget) => {
  if (ynabAccount.deleted) {
    await deleteAccount(ynabAccount.id);
    return;
  }
  const localAccount = await getAccount(ynabAccount.id);
  if (!localAccount) {
    await saveNewAccount(mapAccount(ynabAccount, budget));
  } else {
    await updateAccount(mapAccount(ynabAccount, budget, localAccount._id));
  }
};

const syncYnabAccounts = async (user: UserType, budget: Budget) => {
  const ynabBudget = await findYnabBudget(user, budget);
  const ynabAccountsData = await ynabApi.getAccounts(
    budget.uuid,
    ynabBudget.serverKnowledge.accounts,
    user
  );
  console.log(`syncing ${ynabAccountsData?.accounts?.length} accounts`);
  const promises = ynabAccountsData.accounts.map((ynabAccount) =>
    syncYnabAccount(ynabAccount, budget)
  );
  await Promise.all(promises);
  // for now set knowledge to 0 to have the latest categories all the time (keeps
  // we noticed otherwise that properties as activity, balance are not updated correctly)
  await updateUserServerKnowledge({
    user,
    budget,
    type: "accounts",
    knowledge: ynabAccountsData.knowledge,
  });
};
const syncCategories = async (user: UserType) => {
  const budgets = await findBudgets(user);
  console.log(`syncing categories for ${budgets.length} budgets`);
  const promises = budgets.map((budget) => syncYnabCategories(user, budget));
  await Promise.all(promises);
};

const mapCategory = (
  ynabCategory: ynab.Category,
  budget: Budget,
  _id?: string
): Category => ({
  uuid: ynabCategory.id,
  name: ynabCategory.name,
  budgetId: budget._id || "",
  balance: ynabCategory.balance,
  targetAmount: ynabCategory.goal_target || 0,
  budgeted: ynabCategory.budgeted,
  activity: ynabCategory.activity,
  historicalAverage: 0,
  typicalSpendingPattern: 0,
  _id,
  target: mapTarget(ynabCategory),
});

const mapTarget = (ynabCategory: ynab.Category): CategoryTarget | null => {
  if (!ynabCategory.goal_type) return null; // Only map if goal_type is set

  return {
    goal_type: ynabCategory.goal_type,
    goal_day: ynabCategory.goal_day ?? null,
    goal_cadence: ynabCategory.goal_cadence ?? null,
    goal_cadence_frequency: ynabCategory.goal_cadence_frequency ?? null,
    goal_creation_month: ynabCategory.goal_creation_month ?? null,
    goal_target: ynabCategory.goal_target ?? null,
    goal_target_month: ynabCategory.goal_target_month ?? null,
    goal_percentage_complete: ynabCategory.goal_percentage_complete ?? null,
    goal_months_to_budget: ynabCategory.goal_months_to_budget ?? null,
    goal_under_funded: ynabCategory.goal_under_funded ?? null,
    goal_overall_funded: ynabCategory.goal_overall_funded ?? null,
    goal_overall_left: ynabCategory.goal_overall_left ?? null,
  };
};
const toTransactionsSyncPromise = (user: UserType) => (budget: Budget) =>
  syncTransactions(user, budget);

const syncAllTransactions = async (user: UserType) => {
  console.log("syncing all transactions for user:" + user.authId);
  const localBudgets = await findBudgets(user);
  const promises = localBudgets.map(toTransactionsSyncPromise(user));
  await Promise.all(promises);
};

const syncAccounts = async (user: UserType) => {
  console.log("syncing accounts for user:" + user.authId);
  const localBudgets = await findBudgets(user);
  const promises = localBudgets.map((budget) => syncYnabAccounts(user, budget));
  await Promise.all(promises);
};

export const syncYnabUser = async (user: UserType) => {
  console.log(`syncing Ynab data for user with id: ${user.authId}`);
  try {
    await ynabApi.refreshUserToken(user);
  } catch (e) {
    await clearYnabConnection(user);
  }
  await syncBudgets(user);
  await syncCategories(user);
  await syncAllTransactions(user);
  await syncAccounts(user);
};

export const updateScheduledTransaction = async (
  user: UserType,
  budgetId: string,
  transactionId: string,
  updates: {
    amount?: number;
    categoryId?: string;
    date?: string;
  }
) => {
  try {
    const response = await ynabApi.updateScheduledTransaction(
      budgetId,
      transactionId,
      {
        scheduled_transaction: {
          amount: updates.amount ? updates.amount * 1000 : undefined, // Convert to milliunits
          category_id: updates.categoryId,
          date: updates.date,
        },
      },
      user
    );
    return response.data.scheduled_transaction;
  } catch (error) {
    console.error('Failed to update scheduled transaction:', error);
    throw error;
  }
};

export const deleteScheduledTransaction = async (
  user: UserType,
  budgetId: string,
  transactionId: string
) => {
  try {
    await ynabApi.deleteScheduledTransaction(budgetId, transactionId, user);
  } catch (error) {
    console.error('Failed to delete scheduled transaction:', error);
    throw error;
  }
};
