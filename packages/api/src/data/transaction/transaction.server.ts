import connectDb from "../db";
import { LocalTransaction } from "./transaction.schema";
import { Transaction } from "common-ts";

export type NewOrUpdatedTransaction = {
  accountName: string;
  amount: number;
  date: string;
  categoryId: string | undefined | null;
  payeeName: string | undefined | null;
  memo: string | undefined | null;
};

const TRANSACTION_LIMIT = 10000;
/**
 * Finds transactions based on the provided budgetId and date filter.
 * If a date filter is provided, it will return transactions for the specified month (YYYY-MM format) or for the specified year with format YYYY.
 * If no date filter is provided, it will return all transactions with a limit of TRANSACTION_LIMIT
 * @param budgetId - The ID of the budget to search for transactions.
 * @param dateFilterString - Optional. The date filter string in either YYYY-MM or YYYY format.
 * @returns A promise that resolves to an array of transactions.
 */
export const findTransactions = async (
  budgetId: string,
  dateFilterString?: string // YYYY-MM for transactions of 1 month or YYYY for all of 1 year
): Promise<Transaction[]> => {
  await connectDb();
  console.log("find transactions:" + budgetId + "/" + dateFilterString);

  // find transactions with month with format YYYY-MM or include all if month empty
  const dateFilter = dateFilterString
    ? { $regex: `^${dateFilterString}` }
    : { $exists: true };
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
    categoryId: transaction.categoryId,
    payeeName: transaction.payeeName,
    memo: transaction.memo,
  }));
};

// todo refactor to have bulk inserts, updates and deletes
export const insertOrUpdateMissingTransaction = async (
  uuid: string,
  deleted: boolean,
  budgetId: string,
  newData: NewOrUpdatedTransaction
) => {
  const localTransaction = await LocalTransaction.findOne({ uuid });
  if (!localTransaction && !deleted) {
    const newLocalTransaction = new LocalTransaction({
      uuid,
      budgetId: budgetId,
      ...newData,
    });
    await newLocalTransaction.save();
  } else if (localTransaction) {
    if (deleted) {
      await LocalTransaction.deleteOne({ uuid }).exec();
      return;
    }
    await LocalTransaction.updateOne({ uuid }, newData).exec();
  }
};
