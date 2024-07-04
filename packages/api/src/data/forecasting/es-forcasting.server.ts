import {
  CategoryData,
  MonthSummary,
  MonthlySpending,
  MonthlyForcast,
  Category,
  absoluteD1000Number,
  TransactionData,
} from "common-ts";

const monthSummariesToMonthlySpendingForCategory = (
  monthSummaries: MonthSummary[],
  categoryUuid: string
): MonthlySpending[] => {
  return monthSummaries.map((summary) => {
    const categoryUsage = summary.categoryUsages.find(
      (usage) => usage.uuid === categoryUuid
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
    (acc, data) => acc + absoluteD1000Number(data.amount),
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
        category.uuid
      );
      return {
        id: category.uuid,
        name: category.name,
        budgeted: absoluteD1000Number(category.budgeted),
        spent: absoluteD1000Number(category.activity),
        balance: absoluteD1000Number(category.balance),
        typicalSpendingPattern: calculateTypicalSpendingPatternForCategory(
          monthSummaries,
          category.uuid
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
  /* if (category.spent < 0.9 * category.historicalAverage) {
    console.log(
      "category included when lower than 90% historical average:",
      category.name
    );
  }*/
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
  categoryUuid: string
): TransactionData[] => {
  return monthSummaries.reduce((acc, summary) => {
    const categoryUsage = summary.categoryUsages.find(
      (usage) => usage.uuid === categoryUuid
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
      absoluteD1000Number(transaction.amount) * normalizedDateValue;

    totalSpending += absoluteD1000Number(transaction.amount);
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
  // console.log("days in month:" + daysInMonth);

  // Use historicalAverage from CategoryData for historical trend
  const historicalTrend = filteredCategories.reduce((acc, category) => {
    acc +=
      (category.historicalAverage / daysInMonth) *
      category.typicalSpendingPattern;
    return acc;
  }, 0);
  // console.log("historicalTrend", historicalTrend);
  // Categorical Weighting for Current Month
  const weightedCurrentMonthTrend = filteredCategories.reduce(
    (acc, category) => {
      acc += (category.spent / daysPassed) * category.typicalSpendingPattern;
      return acc;
    },
    0
  );
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
