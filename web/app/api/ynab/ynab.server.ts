import { update } from "ramda";
import * as ynab from "ynab";
import {
  findBudgets,
  getBudget,
  getBudgetWithoutUserCheck,
  saveNewBudget,
  updateBudget,
} from "../budget/budget.server";
import { UserType, clearYnabConnection } from "../user/user.server";
import * as ynabApi from "./ynab-api"; // Import the missing ynapApi module
import {
  deleteCategory,
  getCategory,
  saveNewCategory,
  updateCategory,
} from "../category/category.server";
import { Budget } from "../budget/budget.utils";
import { LocalTransaction } from "../transaction/transaction.schema";
import YnabBudget from "./ynab.schema";
import { ObjectId } from "mongodb";

type ServerKnowledge = {
  transactions: number;
  categories: number;
};

export const emptyServerKnowledge: ServerKnowledge = {
  transactions: 0,
  categories: 0,
};

type YnabBudgetType = {
  serverKnowledge: ServerKnowledge;
};

const insertOrUpdateMissingTransaction = async (
  ynabTransaction: ynab.TransactionDetail,
  budgetId: string
) => {
  const localTransaction = await LocalTransaction.findOne({
    uuid: ynabTransaction.id,
  });
  const newData = {
    accountName: ynabTransaction.account_name,
    amount: ynabTransaction.amount,
    date: ynabTransaction.date,
    categoryName: ynabTransaction.category_name,
    categoryId: ynabTransaction.category_id,
    payeeName: ynabTransaction.payee_name,
    memo: ynabTransaction.memo,
  };
  if (!localTransaction && !ynabTransaction.deleted) {
    const newLocalTransaction = new LocalTransaction({
      uuid: ynabTransaction.id,
      budgetId: budgetId,
      ...newData,
    });
    console.log("save transaction:" + ynabTransaction.id);
    await newLocalTransaction.save();
  } else if (localTransaction) {
    if (ynabTransaction.deleted) {
      await LocalTransaction.deleteOne({ uuid: ynabTransaction.id }).exec();
      return;
    }
    await LocalTransaction.updateOne(
      { uuid: ynabTransaction.id },
      newData
    ).exec();
  }
};

const transactionToInsertOrUpdatePromise =
  (budgetId: string) => (transaction: ynab.TransactionDetail) =>
    insertOrUpdateMissingTransaction(transaction, budgetId);

const insertOrUpdateMissingTransactions = async (
  budgetId: string,
  transactions: ynab.TransactionDetail[]
) => {
  console.log(`insert or update ${transactions.length} number of transactions`);

  const promiseMapper = transactionToInsertOrUpdatePromise(budgetId);
  await Promise.all(transactions.map(promiseMapper));
};

const updateUserServerKnowledge = async ({
  user,
  budget,
  type,
  knowledge,
}: {
  user: UserType;
  budget: Budget;
  type: "transactions" | "categories";
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
  await updateUserServerKnowledge({
    user,
    budget,
    type: "categories",
    knowledge: ynabCategoriesData.knowledge,
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
) => ({
  uuid: ynabCategory.id,
  name: ynabCategory.name,
  budgetId: budget._id || "",
  balance: ynabCategory.balance,
  targetAmount: ynabCategory.goal_target || 0,
  budgeted: ynabCategory.budgeted,
  activity: ynabCategory.activity,
  _id,
});

const toSyncPromise = (user: UserType) => (budget: Budget) =>
  syncTransactions(user, budget);

const syncAllTransactions = async (user: UserType) => {
  console.log("syncing all transactions for user:" + user.authId);
  const localBudgets = await findBudgets(user);
  const promises = localBudgets.map(toSyncPromise(user));
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
};
