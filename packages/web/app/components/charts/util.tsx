import { compose } from "ramda";
import { Transaction, numberD1000 } from "common-ts";


export const nameToColorIndex = (name: string): number => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Ensure the hash is positive
  hash = Math.abs(hash);
  return hash % colorPalette.length;
};

export const nameToUniqueColor = (name: string): string => {
  const color = colorPalette[nameToColorIndex(name)];
  return color;
};

const colorPalette: string[] = [
  "rgb(255, 102, 51)",
  "rgb(255, 179, 153)",
  "rgb(255, 51, 255)",
  "rgb(255, 255, 153)",
  "rgb(0, 179, 230)",
  "rgb(230, 179, 51)",
  "rgb(51, 102, 230)",
  "rgb(153, 153, 102)",
  "rgb(153, 255, 153)",
  "rgb(179, 77, 77)",
  "rgb(128, 179, 0)",
  "rgb(128, 153, 0)",
  "rgb(230, 179, 179)",
  "rgb(102, 128, 179)",
  "rgb(102, 153, 26)",
  "rgb(255, 153, 230)",
  "rgb(204, 255, 26)",
  "rgb(255, 26, 102)",
  "rgb(230, 51, 26)",
  "rgb(51, 255, 204)",
  "rgb(102, 153, 77)",
  "rgb(179, 102, 204)",
  "rgb(77, 128, 0)",
  "rgb(179, 51, 0)",
  "rgb(204, 128, 204)",
  "rgb(102, 102, 77)",
  "rgb(153, 26, 255)",
  "rgb(230, 102, 255)",
  "rgb(77, 179, 255)",
  "rgb(26, 179, 153)",
  "rgb(230, 102, 179)",
  "rgb(51, 153, 26)",
  "rgb(204, 153, 153)",
  "rgb(179, 179, 26)",
  "rgb(0, 230, 128)",
  "rgb(77, 128, 102)",
  "rgb(128, 153, 128)",
  "rgb(230, 255, 128)",
  "rgb(26, 255, 51)",
  "rgb(153, 153, 51)",
  "rgb(255, 51, 128)",
  "rgb(204, 204, 0)",
  "rgb(102, 230, 77)",
  "rgb(77, 128, 204)",
  "rgb(153, 0, 179)",
  "rgb(230, 77, 102)",
  "rgb(77, 179, 128)",
  "rgb(255, 77, 77)",
  "rgb(153, 230, 230)",
  "rgb(102, 102, 255)",
];

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
      (acc, transaction) => acc + numberD1000(transaction.amount),
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


export const chartFormatter = (totalAmount: number, minPercentageToDisplay: number) => (value: string, context: any) => {
  const percentage = valueToPercentageOfTotal(value, totalAmount);
  if (percentage < minPercentageToDisplay) {
    return "";
  }
  return (
    `${context.chart.data.labels[context.dataIndex]
    } ${valueToPercentageOfTotal(value, totalAmount)}%` || value
  );
  // This will display the label of each pie slice inside the slice
};