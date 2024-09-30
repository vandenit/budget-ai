import { describe, it, expect, vi, afterEach } from "vitest";
import { getBudgetOverviewForUser } from "./main.budget.server";
import { MonthSummary } from "common-ts";

const mocks = vi.hoisted(() => {
  return {
    findCategories: vi.fn(),
    getCategoryHistory: vi.fn(),
    forecastSpendingWithES: vi.fn(),
  };
});

const categoryHistoryMockData = [
  {
    categoryUuid: "1",
    categoryName: "Category 1",
    activity: -500,
    month: "2021-01",
  },
  {
    categoryUuid: "2",
    categoryName: "Category 2",
    activity: -1000,
    month: "2021-01",
  },
  {
    categoryUuid: "1",
    categoryName: "Category 1",
    activity: -1000,
    month: "2021-02",
  },
  {
    categoryUuid: "2",
    categoryName: "Category 2",
    activity: -2000,
    month: "2021-02",
  },
];

const categoryData = [
  {
    _id: "1",
    name: "Category 1",
    balance: 1000,
    activity: -500,
    budgeted: 200,
  },
  {
    _id: "2",
    name: "Category 2",
    balance: 2000,
    activity: -1000,
    budgeted: 300,
  },
];

const esData = {
  totalSpentSoFar: 100,
  predictedSpendingEndOfMonth: 150,
  predictedRemainingPerDay: 50,
  actualRemainingPerDay: 50,
  predictedRemainingAmount: 100,
  remainingDays: 2,
  available: 200,
  extraAmountNeeded: 100,
};

describe("main budget server tests", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
  // todo cleanup and use constants instead of duplicated values
  describe("getBudgetOverviewForUser", () => {
    it("should return the budget overview for the user", async () => {
      // end of month so month percentage should be 100
      const date = new Date("2021-01-31T00:00:00Z");
      vi.setSystemTime(date);

      // Arrange
      const budgetId = "1";
      const monthPercentage = 100;
      const monthSummaries: MonthSummary[] = [
        {
          month: "2021-02",
          isCurrentMonth: false,
          categoryUsages: [
            {
              uuid: "1",
              name: "Category 1",
              amount: -1000,
            },
            {
              uuid: "2",
              name: "Category 2",
              amount: -2000,
            },
          ],
        },
        {
          month: "2021-01",
          isCurrentMonth: true,
          categoryUsages: [
            {
              uuid: "1",
              name: "Category 1",
              amount: -500,
            },
            {
              uuid: "2",
              name: "Category 2",
              amount: -1000,
            },
          ],
        },
      ];
      const monthTotal = {
        totalSpent: -1500,
        totalBudgeted: 500,
        totalBalance: 3000,
      };

      vi.mock("./forecasting/es-forcasting.server", () => ({
        forecastSpendingWithES: mocks.forecastSpendingWithES,
      }));
      vi.mock("./category/category.server", () => ({
        getCategoryHistoryForBudget: mocks.getCategoryHistory,
        findCategories: mocks.findCategories,
      }));
      mocks.findCategories.mockResolvedValue(categoryData);
      mocks.forecastSpendingWithES.mockReturnValue(esData);
      mocks.getCategoryHistory.mockResolvedValue(categoryHistoryMockData);

      // Act
      const result = await getBudgetOverviewForUser(budgetId);

      // Assert
      expect(result.monthPercentage).toBe(monthPercentage);
      expect(result.monthSummaries).toStrictEqual(monthSummaries);
      expect(result.categories).toBe(categoryData);
      expect(result.monthTotal).toStrictEqual(monthTotal);
      expect(result.forecast).toBe(esData);
    });
  });
});
