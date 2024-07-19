import { uniq } from "ramda";
import { TransactionDetail } from "ynab";

/**
 *
 * @param transactions
 * @returns a sorted array of unique years extracted from transactions
 */
export const extractYearsFromTransactions = (
  transactions: TransactionDetail[]
): string[] =>
  uniq(
    transactions.map((transaction) => transaction.date.substring(0, 4))
  ).sort();
