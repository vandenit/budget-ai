import moment from "moment";
import {
  GroupedTransactions,
  Transaction,
} from "common-ts";

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

// Generic grouping function that works with any transaction-like object
export const groupByDateGeneric = <T extends { date: string }>(
  transactions: T[]
): { [date: string]: T[] } => {
  return transactions.reduce(
    (groups: { [date: string]: T[] }, transaction: T) => {
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

// Generic totals calculation for any transaction-like object with amount
export const calculateTotalsGeneric = <T extends { amount: number }>(
  transactions: T[]
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
