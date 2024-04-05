import "server-only";
import { connect } from "http2";
import * as ynabApi from "../ynab/ynab-api";
import connectDb from "../db";
import { getLoggedInUser, getUserByAuthId } from "../user/user.server";
import { UserTransaction, LocalTransaction } from "./transaction.schema";
import { TransactionDetail, TransactionResponseData } from "ynab";
import mongoose from "mongoose";
import { Transaction } from "./transaction.utils";

const createOrUpdateUserTransaction = async (
  userId: mongoose.Schema.Types.ObjectId,
  budgetId: string,
  lastKnowledgeOfServer: number
) => {
  const userTransaction = await UserTransaction.findOne({ userId, budgetId });
  if (userTransaction) {
    userTransaction.lastKnowledgeOfServer = lastKnowledgeOfServer;
    await userTransaction.save();
    return;
  }
  const newUserTransaction = new UserTransaction({
    userId,
    budgetId,
    lastKnowledgeOfServer,
  });
  await newUserTransaction.save();
};

const insertOrUpdateMissingTransaction = async (
  ynabTransaction: TransactionDetail,
  budgetId: string
) => {
  const localTransaction = await LocalTransaction.findOne({
    id: ynabTransaction.id,
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
      id: ynabTransaction.id,
      budgetId,
      ...newData,
    });
    await newLocalTransaction.save();
  } else if (localTransaction) {
    if (ynabTransaction.deleted) {
      await LocalTransaction.deleteOne({ id: ynabTransaction.id }).exec();
      return;
    }
    await LocalTransaction.updateOne(
      { id: ynabTransaction.id },
      newData
    ).exec();
  }
};

const insertOrUpdateMissingTransactions = async (
  budgetId: string,
  transactions: TransactionDetail[]
) => {
  console.log(`insert or update ${transactions.length} number of transactions`);
  transactions.forEach(async (transaction) => {
    await insertOrUpdateMissingTransaction(transaction, budgetId);
  });
};

const notDeleted = (transaction: TransactionDetail) => !transaction.deleted;

const mergeTransactions = (
  ynabTransactions: TransactionDetail[],
  localTransactions: Transaction[]
): Transaction[] => {
  const mappedYnabrTransactions: Transaction[] = ynabTransactions
    .filter(notDeleted)
    .map((transaction) => ({
      id: transaction.id,
      accountName: transaction.account_name,
      amount: transaction.amount,
      date: transaction.date,
      categoryName: transaction.category_name || "",
      categoryId: transaction.category_id,
      payeeName: transaction.payee_name || "",
      memo: transaction.memo || "",
    }));
  const mappedLocalTransactions: Transaction[] = localTransactions.map(
    (transaction) => ({
      id: transaction.id,
      accountName: transaction.accountName,
      amount: transaction.amount,
      date: transaction.date,
      categoryName: transaction.categoryName,
      categoryId: transaction.categoryId,
      payeeName: transaction.payeeName,
      memo: transaction.memo,
    })
  );
  mappedYnabrTransactions.forEach((ynabTransaction) => {
    const localTransaction = mappedLocalTransactions.find(
      (localTransaction) => localTransaction.id === ynabTransaction.id
    );
    if (!localTransaction) {
      mappedLocalTransactions.push(ynabTransaction);
    } else {
      localTransaction.accountName = ynabTransaction.accountName;
      localTransaction.amount = ynabTransaction.amount;
      localTransaction.date = ynabTransaction.date;
      localTransaction.categoryName = ynabTransaction.categoryName;
      localTransaction.categoryId = ynabTransaction.categoryId;
      localTransaction.payeeName = ynabTransaction.payeeName;
      localTransaction.memo = ynabTransaction.memo;
    }
  });
  return mappedLocalTransactions;
};

export const findTransactions = async (
  budgetId: string,
  month?: string
): Promise<Transaction[]> => {
  await connectDb();
  console.log("find transactions:" + budgetId + "/" + month);
  const user = await getLoggedInUser();
  if (!user) {
    return [];
  }
  const userTransaction = await UserTransaction.findOne({
    userId: user._id,
    budgetId,
  });
  const lastKnowledgeOfServer = userTransaction?.lastKnowledgeOfServer || 0;
  const ynabTransactions = await ynabApi.getTransactions(
    budgetId,
    lastKnowledgeOfServer
  );
  createOrUpdateUserTransaction(
    user._id,
    budgetId,
    ynabTransactions.server_knowledge
  );
  // find transactions with month with format YYYY-MM or include all if month empty
  const dateFilter = month ? { $regex: `^${month}` } : { $exists: true };
  const filter = {
    budgetId,
    date: dateFilter,
  };
  console.log("filter?" + JSON.stringify(filter));
  const localTransactions = await LocalTransaction.find(filter).sort({
    date: -1,
  });
  insertOrUpdateMissingTransactions(budgetId, ynabTransactions.transactions);
  return mergeTransactions(
    ynabTransactions.transactions.filter((ynabTransaction) =>
      ynabTransaction.date.startsWith(month || "")
    ),
    localTransactions
  );
};
