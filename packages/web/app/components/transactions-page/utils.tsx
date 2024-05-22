import moment from "moment";
import {
  GroupedTransactions,
  Transaction,
} from "@/app/api/transaction/transaction.utils";

export const formatDate = (dateString: string): string => {
  return moment(dateString).format("dddd, MMMM Do YYYY");
};

export const groupByDate = (
  transactions: Transaction[]
): GroupedTransactions => {
  return transactions.reduce(
    (groups: GroupedTransactions, transaction: Transaction) => {
      const date = transaction.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    },
    {}
  );
};

export const calculateTotals = (
  transactions: Transaction[]
): { income: number; outcome: number } => {
  return transactions.reduce(
    ({ income, outcome }, transaction) => {
      if (transaction.amount >= 0) {
        income += transaction.amount;
      } else {
        outcome += transaction.amount;
      }
      return { income, outcome };
    },
    { income: 0, outcome: 0 }
  );
};
