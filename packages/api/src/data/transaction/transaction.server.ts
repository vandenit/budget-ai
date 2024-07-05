import connectDb from "../db";
import { LocalTransaction } from "./transaction.schema";
import { Transaction } from "common-ts";

export const findTransactions = async (
  budgetId: string,
  month?: string
): Promise<Transaction[]> => {
  await connectDb();
  console.log("find transactions:" + budgetId + "/" + month);

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
