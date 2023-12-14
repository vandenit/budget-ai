import { compose } from "ramda";
import { Transaction } from "@/app/api/budget.server";
import { ynabAbsoluteNumber, ynabNumber } from "@/app/utils/ynab";

export type MonthlySpendingData = {
  dayOfMonth: string;
  spent: number;
};

const daysOfMonthAsStrings = () => {
  const days = [];
  for (let i = 1; i <= 31; i++) {
    days.push(i.toString());
  }
  return days;
};

export const getMonthlySpendingData = (
  transactions: Transaction[]
): MonthlySpendingData[] =>
  compose(
    ifAllNegativeShowPositive,
    transactionsToMonthlySpendingData
  )(transactions);

const transactionsToMonthlySpendingData = (
  transactions: Transaction[]
): MonthlySpendingData[] => {
  const groupedByDay = transactions.reduce((acc, transaction) => {
    const dayOfMonth = new Date(transaction.date).getDate();
    if (!acc[dayOfMonth]) {
      acc[dayOfMonth] = [];
    }
    acc[dayOfMonth].push(transaction);
    return acc;
  }, {} as { [key: number]: Transaction[] });

  return daysOfMonthAsStrings().map((dayOfMonth) => {
    const transactions = groupedByDay[parseInt(dayOfMonth)];
    if (!transactions) {
      return {
        dayOfMonth,
        spent: 0,
      };
    }
    const spent = transactions.reduce(
      (acc, transaction) => acc + ynabNumber(transaction.amount),
      0
    );
    return {
      dayOfMonth,
      spent,
    };
  });
};

const ifAllNegativeShowPositive = (
  spendingData: MonthlySpendingData[]
): MonthlySpendingData[] => {
  const allNegative = spendingData.every((data) => data.spent <= 0);
  if (allNegative) {
    return spendingData.map((data) => ({
      ...data,
      spent: Math.abs(data.spent),
    }));
  }
  return spendingData;
};

export const isOnMobileDevice = () =>
  // based on user agent string
  // https://stackoverflow.com/a/8876069/10247962
  navigator
    ? /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    : false;

export const valueToPercentageOfTotal = (
  value: string,
  total: number
): number => {
  const numValue = parseFloat(value);
  return Math.round((numValue / total) * 100);
};
