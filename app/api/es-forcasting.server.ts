import { av, c } from "vitest/dist/reporters-5f784f42.js";
import { Category, MonthSummary, Transaction } from "./budget.server";
import { ynabAbsoluteNumber } from "../utils/ynab";

type CategoryData = {
  id: string;
  name: string;
  budgeted: number;
  balance: number;
  spent: number;
  typicalSpendingPattern: number; // A weight from 0 (start of month) to 1 (end of month)
  historicalAverage: number;
};

type TransactionData = {
  date: Date;
  amount: number;
  categoryId: string;
  categoryName: string;
};

type MonthlySpending = {
  month: Date;
  amount: number;
};

export type MonthlyForcast = {
  totalSpentSoFar: number;
  predictedSpendingEndOfMonth: number;
  predictedRemainingPerDay: number;
  actualRemainingPerDay: number;
  predictedRemainingAmount: number;
  remainingDays: number;
  available: number;
  extraAmountNeeded: number;
};

const monthSummariesToMonthlySpendingForCategory = (
  monthSummaries: MonthSummary[],
  categoryId: string
): MonthlySpending[] => {
  return monthSummaries.map((summary) => {
    const categoryUsage = summary.categoryUsage.find(
      (usage) => usage.categoryId === categoryId
    );
    return {
      month: new Date(summary.month),
      amount: categoryUsage ? categoryUsage.amount : 0,
    };
  });
};

const calculateHistoricalAverage = (
  spendingData: MonthlySpending[]
): number => {
  const totalSpending = spendingData.reduce(
    (acc, data) => acc + ynabAbsoluteNumber(data.amount),
    0
  );
  return totalSpending / spendingData.length;
};

export const categoriesToCategoryData = (
  categories: Category[],
  monthSummaries: MonthSummary[]
): CategoryData[] => {
  return categories
    .map((category) => {
      const spendingData = monthSummariesToMonthlySpendingForCategory(
        monthSummaries,
        category.categoryId
      );
      return {
        id: category.categoryId,
        name: category.categoryName,
        budgeted: ynabAbsoluteNumber(category.budgeted),
        spent: ynabAbsoluteNumber(category.activity),
        balance: ynabAbsoluteNumber(category.balance),
        typicalSpendingPattern: calculateTypicalSpendingPatternForCategory(
          monthSummaries,
          category.categoryId
        ),
        historicalAverage: calculateHistoricalAverage(spendingData),
      };
    })
    .filter((category) => category.historicalAverage > 0)
    .filter((category) => !category.name.startsWith("Inflow"));
};

const categoryClosedWhenAbove90HistoricalAverageFilter = (
  category: CategoryData
) => {
  if (category.spent < 0.9 * category.historicalAverage) {
    console.log(
      "category included when lower than 90% historical average:",
      category.name
    );
  }
  return category.spent < 0.9 * category.historicalAverage;
};
const calculateTypicalSpendingPatternForCategory = (
  monthSummaries: MonthSummary[],
  categoryId: string
): number =>
  calculateTypicalSpendingPatternForMultipleMonths(
    collectTransactionsForCategory(monthSummaries, categoryId)
  );

const collectTransactionsForCategory = (
  monthSummaries: MonthSummary[],
  categoryId: string
): TransactionData[] => {
  return monthSummaries.reduce((acc, summary) => {
    const categoryUsage = summary.categoryUsage.find(
      (usage) => usage.categoryId === categoryId
    );
    if (categoryUsage) {
      acc = acc.concat(
        categoryUsage.transactions.map((transaction) => ({
          date: new Date(transaction.date),
          amount: transaction.amount,
          categoryId: transaction.categoryId || "",
          categoryName: transaction.categoryName || "",
        }))
      );
    }
    return acc;
  }, [] as TransactionData[]);
};

const calculateTypicalSpendingPatternForMultipleMonths = (
  transactions: TransactionData[]
): number => {
  let totalWeightedSum = 0;
  let totalSpending = 0;
  transactions.forEach((transaction) => {
    const daysInThatMonth = new Date(
      transaction.date.getFullYear(),
      transaction.date.getMonth() + 1,
      0
    ).getDate();
    const dayOfTransaction = transaction.date.getDate();
    const normalizedDateValue = dayOfTransaction / daysInThatMonth;
    totalWeightedSum +=
      ynabAbsoluteNumber(transaction.amount) * normalizedDateValue;

    totalSpending += ynabAbsoluteNumber(transaction.amount);
  });
  return totalWeightedSum / totalSpending;
};

export function forecastSpendingWithES(
  categories: CategoryData[],
  alpha = 0.5 // Smoothing factor for Exponential Smoothing, typically between 0 and 1
): MonthlyForcast {
  const filteredCategories = categories.filter(
    categoryClosedWhenAbove90HistoricalAverageFilter
  );
  const currentDate = new Date();
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  const daysPassed = currentDate.getDate();

  const totalSpentSoFar = categories.reduce(
    (acc, category) => acc + category.spent,
    0
  );
  const totalAvailableSoFar = categories.reduce(
    (acc, category) => acc + category.balance,
    0
  );
  const totalSpentSoFarNonClosed = filteredCategories.reduce(
    (acc, category) => acc + category.spent,
    0
  );
  console.log("days in month:" + daysInMonth);

  // Use historicalAverage from CategoryData for historical trend
  const historicalTrend = filteredCategories.reduce((acc, category) => {
    acc +=
      (category.historicalAverage / daysInMonth) *
      category.typicalSpendingPattern;
    return acc;
  }, 0);
  console.log("historicalTrend", historicalTrend);
  // Categorical Weighting for Current Month
  const weightedCurrentMonthTrend = filteredCategories.reduce(
    (acc, category) => {
      acc += (category.spent / daysPassed) * category.typicalSpendingPattern;
      return acc;
    },
    0
  );
  console.log("weightedCurrentMonthTrend", weightedCurrentMonthTrend);
  // Exponential Smoothing Forecast
  const forecastedSpending =
    alpha * weightedCurrentMonthTrend + (1 - alpha) * historicalTrend;

  const predictedSpendingEndOfMonth =
    totalSpentSoFar -
    totalSpentSoFarNonClosed +
    forecastedSpending * daysInMonth;
  const predictedRemainingPerDay =
    (predictedSpendingEndOfMonth - totalSpentSoFar) /
    (daysInMonth - daysPassed);
  const predictedRemainingAmount =
    predictedSpendingEndOfMonth - totalSpentSoFar;
  return {
    totalSpentSoFar,
    predictedSpendingEndOfMonth,
    predictedRemainingPerDay,
    actualRemainingPerDay: totalAvailableSoFar / (daysInMonth - daysPassed),
    predictedRemainingAmount,
    remainingDays: daysInMonth - daysPassed,
    available: totalAvailableSoFar,
    extraAmountNeeded: predictedRemainingAmount - totalAvailableSoFar,
  };
}
// You can then use this function with the necessary data and choose a suitable alpha value
