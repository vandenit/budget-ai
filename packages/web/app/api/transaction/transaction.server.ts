import "server-only";
import { connect } from "http2";
import connectDb from "../db";
import { getLoggedInUser, getUserByAuthId } from "../user/user.server";
import { LocalTransaction } from "./transaction.schema";
import mongoose from "mongoose";
import { Transaction } from "./transaction.utils";
import { getBudget } from "../main.budget.server";

export const findTransactions = async (
  budgetUuid: string,
  month?: string
): Promise<Transaction[]> => {
  await connectDb();
  console.log("find transactions:" + budgetUuid + "/" + month);

  const budget = await getBudget(budgetUuid);
  if (!budget) {
    return [];
  }
  // find transactions with month with format YYYY-MM or include all if month empty
  const dateFilter = month ? { $regex: `^${month}` } : { $exists: true };
  const filter = {
    budgetId: budget._id || "",
    date: dateFilter,
  };
  console.log("filter?" + JSON.stringify(filter));
  const localTransactions = await LocalTransaction.find(filter).sort({
    date: -1,
  });
  return localTransactions.map((transaction) => ({
    uuid: transaction.uuid,
    accountName: transaction.accountName,
    amount: transaction.amount,
    date: transaction.date,
    categoryName: transaction.categoryName,
    categoryId: transaction.categoryId,
    payeeName: transaction.payeeName,
    memo: transaction.memo,
  }));
};
