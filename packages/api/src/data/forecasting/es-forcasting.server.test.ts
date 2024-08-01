import { Category } from "common-ts";
import { forecastSpendingWithES } from "./es-forcasting.server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { findTransactions } from "../transaction/transaction.server";
import {
  clearCategoryHistoryForYear,
  saveSpendingData,
  populateCategoryHistoryFromTransactions,
} from "../category/category.server";
import { updateTransactionsSpendingPattern } from "./es-forcasting.server";
import { buffer } from "stream/consumers";

const mocks = vi.hoisted(() => {
  return {
    findTransactions: vi.fn(),
  };
});
vi.mock("../transaction/transaction.server", () => ({
  findTransactions: mocks.findTransactions,
}));

describe("es-forcasting.server", () => {
  afterEach(() => {
    // restoring date after each test run
    vi.useRealTimers();
    vi.clearAllMocks();
  });
  describe("forecastSpendingWithES", () => {
    beforeEach(() => {
      // tell vitest we use mocked time
      vi.useFakeTimers();
    });

    it("should calculate the forecasted spending correctly at the beginning of the month", () => {
      // mock date with vi
      const date = new Date("2021-01-01T00:00:00Z");
      vi.setSystemTime(date);

      // Arrange
      const categories: any[] = [
        {
          _id: "1",
          name: "Category 1",
          balance: 1000,
          activity: -500000,
          budgeted: 200000,
          historicalAverage: 800000,
          typicalSpendingPattern: 0.6,
        },
        {
          id: "2",
          name: "Category 2",
          balance: 2000,
          activity: -1000000,
          budgeted: 200000,
          historicalAverage: 1200000,
          typicalSpendingPattern: 0.8,
        },
      ];
      const alpha = 0.5;

      // Act
      const result = forecastSpendingWithES(categories, alpha);

      // Assert
      expect(result.totalSpentSoFar).toBe(1500);
      expect(result.predictedSpendingEndOfMonth).toBe(737050.0000000001);
      expect(result.predictedRemainingPerDay).toBe(24518.333333333336);
      expect(result.actualRemainingPerDay).toBe(100);
      expect(result.predictedRemainingAmount).toBe(735550.0000000001);
      expect(result.remainingDays).toBe(30);
      expect(result.available).toBe(3000);
      expect(result.extraAmountNeeded).toBe(732550.0000000001);
    });
  });

  describe("updateTransactionsSpendingPattern", () => {
    vi.mock("../category/category.server", () => ({
      saveSpendingData: vi.fn().mockResolvedValue({ result: true }),
      clearCategoryHistoryForYear: vi.fn().mockResolvedValue({ result: true }),
      populateCategoryHistoryFromTransactions: vi.fn().mockResolvedValue({
        result: true,
      }),
    }));

    describe("with transactions with categories", () => {
      const mockedTransactions = [
        {
          categoryId: "1",
          amount: 1000000,
          date: "2021-01-01",
        },
        {
          categoryId: "1",
          amount: 2000000,
          date: "2021-02-01",
        },
        {
          categoryId: "2",
          amount: 3000000,
          date: "2021-01-31",
        },
        {
          categoryId: "", // empty should be filtered out
          amount: 3000000,
          date: "2021-01-31",
        },
      ];

      beforeEach(() => {
        mocks.findTransactions.mockResolvedValue(mockedTransactions);
      });

      it("should calculate the typical spending pattern for multiple months and save the spending data", async () => {
        // Arrange
        const budgetId = "123";
        const expectedCategoryData = [
          {
            categoryId: "1",
            historicalAverage: 1500000,
            typicalSpendingPattern: 0.034562211981566816,
          },
          {
            categoryId: "2",
            historicalAverage: 3000000,
            typicalSpendingPattern: 1,
          },
        ];

        // Act
        await updateTransactionsSpendingPattern(budgetId, "2021");

        // Assert
        expect(findTransactions).toHaveBeenCalledWith(budgetId, "2021");
        expect(saveSpendingData).toHaveBeenCalledWith(expectedCategoryData);
        expect(clearCategoryHistoryForYear).toHaveBeenCalledWith(
          budgetId,
          "2021"
        );
        expect(populateCategoryHistoryFromTransactions).toHaveBeenCalledWith(
          budgetId,
          mockedTransactions,
          "2021"
        );
      });
    });

    describe("with transactions with no categoryId", () => {
      beforeEach(() => {
        const mockedTransactions = [
          {
            categoryId: "", // empty should be filtered out
            amount: 3000000,
            date: "2021-01-31",
          },
        ];
        mocks.findTransactions.mockResolvedValue(mockedTransactions);
      });

      it("should not do anything if no valid categories are found", async () => {
        // Arrange
        const budgetId = "123";

        // Act
        await updateTransactionsSpendingPattern(budgetId, "2021");

        // Assert
        expect(findTransactions).toHaveBeenCalledWith(budgetId, "2021");
        expect(saveSpendingData).not.toHaveBeenCalled();
        expect(clearCategoryHistoryForYear).not.toHaveBeenCalled();
        expect(populateCategoryHistoryFromTransactions).not.toHaveBeenCalled();
      });
    });
  });
});
