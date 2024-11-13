import {
  MonthlyForcast,
  Category,
  absoluteD1000Number,
  Transaction,
} from "common-ts";
import { findTransactions } from "../transaction/transaction.server";
import { uniq } from "ramda";
import {
  clearCategoryHistoryForYear,
  populateCategoryHistoryFromTransactions,
  saveSpendingData,
} from "../category/category.server";

type SpendingPattern = {
  typicalSpendingPattern: number;
  historicalAverage: number;
};

const spent = (category: Category) => absoluteD1000Number(category.activity);

const categoryClosedWhenAbove90HistoricalAverageFilter = (
  category: Category
) => {
  return spent(category) < 0.9 * category.historicalAverage;
};

export const updateTransactionsSpendingPattern = async (
  budgetId: string,
  yearString: string // eg "2021"
) => {
  console.log(
    `updating spending pattern for ${budgetId} for year ${yearString}`
  );
  const transactions = await findTransactions(budgetId, yearString);
  const uniqCategories = uniq(
    transactions.map((transaction) => transaction.categoryId)
  ).filter((categoryId) => categoryId);
  if (!uniqCategories.length) {
    console.log("no valid categories found");
    return;
  }
  const categoryData = uniqCategories.map((categoryId) => {
    const categoryTransactions = transactions.filter(
      (transaction) => transaction.categoryId === categoryId
    );
    const categorySpendingPattern =
      calculateTypicalSpendingPatternForMultipleMonths(categoryTransactions);
    return {
      categoryId: categoryId || "",
      historicalAverage: categorySpendingPattern.historicalAverage,
      typicalSpendingPattern: categorySpendingPattern.typicalSpendingPattern,
    };
  });
  await saveSpendingData(categoryData);
  await clearCategoryHistoryForYear(budgetId, yearString);
  await populateCategoryHistoryFromTransactions(
    budgetId,
    transactions,
    yearString
  );
};

const calculateTypicalSpendingPatternForMultipleMonths = (
  transactions: Transaction[]
): SpendingPattern => {
  let totalWeightedSum = 0;
  let totalSpending = 0;
  transactions.forEach((transaction) => {
    const transactionDate = new Date(transaction.date);
    const daysInThatMonth = new Date(
      transactionDate.getFullYear(),
      transactionDate.getMonth() + 1,
      0
    ).getDate();
    const dayOfTransaction = transactionDate.getDate();
    const normalizedDateValue = dayOfTransaction / daysInThatMonth;
    totalWeightedSum += Math.abs(transaction.amount) * normalizedDateValue;

    totalSpending += Math.abs(transaction.amount);
  });
  const averageSpending = totalSpending / transactions.length;
  return {
    typicalSpendingPattern: totalWeightedSum / totalSpending,
    historicalAverage: averageSpending,
  };
};

export function forecastSpendingWithES(
  categories: Category[],
  alpha = 0.5 // Smoothing factor for Exponential Smoothing, typically between 0 and 1
): MonthlyForcast {
  const categoriesWithBudget = categories.filter(
    (category) => category.budgeted > 0
  );
  const filteredCategories = categoriesWithBudget.filter(
    categoryClosedWhenAbove90HistoricalAverageFilter
  );
  const currentDate = new Date();
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  const daysPassed = currentDate.getDate();

  const totalSpentSoFar = categoriesWithBudget.reduce(
    (acc, category) => acc + spent(category),
    0
  );
  const totalAvailableSoFar = categoriesWithBudget.reduce(
    (acc, category) => acc + category.balance,
    0
  );
  const totalSpentSoFarNonClosed = filteredCategories.reduce(
    (acc, category) => acc + spent(category),
    0
  );
  // console.log("days in month:" + daysInMonth);

  // Use historicalAverage from CategoryData for historical trend
  /* const historicalTrend = filteredCategories.reduce((acc, category) => {
    acc +=
      (category.historicalAverage / daysInMonth) *
      category.typicalSpendingPattern;
    return acc;
  }, 0);*/
  // console.log("historicalTrend", historicalTrend);
  // Categorical Weighting for Current Month
  /* const weightedCurrentMonthTrend = filteredCategories.reduce(
    (acc, category) => {
      acc += (spent(category) / daysPassed) * category.typicalSpendingPattern;
      return acc;
    },
    0
  );*/
  const categoryTrends = filteredCategories.map((category) => {
    return {
      category,
      weightedCurrentMonthTrend:
        (spent(category) / daysPassed) * category.typicalSpendingPattern,
      historicalTrend:
        (category.historicalAverage / daysInMonth) *
        category.typicalSpendingPattern,
    };
  });
  const weightedCurrentMonthTrend = categoryTrends.reduce(
    (acc, categoryTrend) => {
      acc += categoryTrend.weightedCurrentMonthTrend;
      return acc;
    },
    0
  );
  const historicalTrend = categoryTrends.reduce((acc, categoryTrend) => {
    acc += categoryTrend.historicalTrend;
    return acc;
  }, 0);
  // ("weightedCurrentMonthTrend", weightedCurrentMonthTrend);
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
  console.log("days left:" + (daysInMonth - daysPassed));
  console.log("totalAvailableSoFar:" + totalAvailableSoFar);
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
