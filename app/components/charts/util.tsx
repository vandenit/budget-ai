import { Transaction } from "@/app/api/budget.server";
import { ynabAbsoluteNumber, ynabNumber } from "@/app/utils/ynab";

export type MonthlySpendingData = {
  dayOfMonth: string;
  spent: number;
};

export const transactionsToMonthlySpendingData = (
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

  return Object.keys(groupedByDay).map((dayOfMonth) => {
    const transactions = groupedByDay[parseInt(dayOfMonth)];
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
