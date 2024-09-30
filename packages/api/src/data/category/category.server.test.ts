import { describe, it, expect, vi, afterEach } from "vitest";
import { saveSpendingData } from "./category.server";
import * as categoryServer from "./category.server";
import { LocalCategory, LocalCategoryHistory } from "./category.schema";
import { exec } from "child_process";

describe("categoryServer tests", () => {
  describe("saveSpendingData", () => {
    it("should update the category data for each category", async () => {
      const categoryData = [
        {
          categoryId: "1",
          historicalAverage: 100,
          typicalSpendingPattern: 50,
        },
        {
          categoryId: "2",
          historicalAverage: 200,
          typicalSpendingPattern: 60,
        },
      ];

      // Mock the LocalCategory.bulkWrite function
      const bulkWriteMock = vi.fn();
      vi.mocked(LocalCategory).bulkWrite = bulkWriteMock;

      // Call the saveSpendingData function
      await saveSpendingData(categoryData);

      // Expect the LocalCategory.bulkWrite function to be called with the correct operations
      expect(bulkWriteMock).toHaveBeenCalledWith([
        {
          updateOne: {
            filter: { _id: "1" },
            update: {
              $set: {
                historicalAverage: 100,
                typicalSpendingPattern: 50,
              },
            },
          },
        },
        {
          updateOne: {
            filter: { _id: "2" },
            update: {
              $set: {
                historicalAverage: 200,
                typicalSpendingPattern: 60,
              },
            },
          },
        },
      ]);
    });
  });

  describe("getCategoryHistoryForBudget", () => {
    it("should return the category history for the budget", async () => {
      // Mock the getCategoryHistory function
      const aggregateMock = vi.fn();
      vi.mocked(LocalCategory).aggregate = aggregateMock;

      // Call the getCategoryHistoryForBudget function
      await categoryServer.getCategoryHistoryForBudget("123");

      // Expect the getCategoryHistory function to be called with the correct arguments
      const budgetId = "123";
      const $expr = { $eq: ["$categoryId", "$$categoryId"] };
      expect(aggregateMock).toHaveBeenCalledWith([
        {
          $match: {
            budgetId,
          },
        },
        {
          $lookup: {
            from: "categoryhistories", // The collection name for CategoryHistory
            let: { categoryId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr,
                },
              },
            ],
            as: "categoryInfo",
          },
        },
        {
          $unwind: {
            path: "$categoryInfo",
            preserveNullAndEmptyArrays: true, // Set to true if you want categories without history as well
          },
        },
        {
          $project: {
            categoryName: "$name",
            categoryUuid: "$uuid",
            categoryId: "$_id",
            month: "$categoryInfo.month",
            activity: "$categoryInfo.activity",
          },
        },
      ]);
    });
  });

  describe("getCategoryHistoryForMonth", () => {
    it("should return the category history for the budget and month", async () => {
      // Mock the getCategoryHistory function
      const aggregateMock = vi.fn();
      vi.mocked(LocalCategory).aggregate = aggregateMock;

      const month = "2021-01";
      const budgetId = "123";
      // Call the getCategoryHistoryForBudget function
      await categoryServer.getCategoryHistoryForMonth(month, budgetId);

      // Expect the getCategoryHistory function to be called with the correct arguments
      const $expr = {
        $and: [
          { $eq: ["$categoryId", "$$categoryId"] },
          { $eq: ["$month", month] },
        ],
      };
      expect(aggregateMock).toHaveBeenCalledWith([
        {
          $match: {
            budgetId,
          },
        },
        {
          $lookup: {
            from: "categoryhistories", // The collection name for CategoryHistory
            let: { categoryId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr,
                },
              },
            ],
            as: "categoryInfo",
          },
        },
        {
          $unwind: {
            path: "$categoryInfo",
            preserveNullAndEmptyArrays: true, // Set to true if you want categories without history as well
          },
        },
        {
          $project: {
            categoryName: "$name",
            categoryUuid: "$uuid",
            categoryId: "$_id",
            month: "$categoryInfo.month",
            activity: "$categoryInfo.activity",
          },
        },
      ]);
    });
  });

  describe("clearCategoryHistoryForYear", () => {
    it("should delete category history for the specified year", async () => {
      const budgetId = "123";
      const yearString = "2022";
      const execMock = vi.fn();
      // Mock the LocalCategoryHistory.deleteMany function with vi
      const deleteManyMock = vi.fn();
      deleteManyMock.mockReturnValue({
        exec: execMock,
      });
      execMock.mockResolvedValue({
        result: true,
      });
      vi.mocked(LocalCategoryHistory).deleteMany = deleteManyMock;

      // Call the clearCategoryHistoryForYear function
      const result = await categoryServer.clearCategoryHistoryForYear(
        budgetId,
        yearString
      );

      // Expect the LocalCategoryHistory.deleteMany function to be called with the correct arguments
      expect(deleteManyMock).toHaveBeenCalledWith({
        budgetId,
        month: { $regex: `^2022-` },
      });
      expect(execMock).toHaveBeenCalledOnce();
    });
  });

  describe("populateCategoryHistoryFromTransactions", () => {
    it("should insert category histories for the specified year and budgetId", async () => {
      const budgetId = "123";
      const insertManyMock = vi.fn();
      const transactions: any[] = [
        {
          categoryId: "1",
          amount: 100,
          date: "2022-01-01",
        },
        {
          categoryId: "2",
          amount: 200,
          date: "2022-01-02",
        },
      ];
      const year = "2022";

      // Mock the LocalCategoryHistory.insertMany function
      vi.mocked(LocalCategoryHistory).insertMany = insertManyMock;

      insertManyMock.mockResolvedValueOnce([]);

      // Call the populateCategoryHistoryFromTransactions function
      await categoryServer.populateCategoryHistoryFromTransactions(
        budgetId,
        transactions,
        year
      );

      // Expect the LocalCategoryHistory.insertMany function to be called with the correct arguments
      expect(insertManyMock).toHaveBeenCalledWith([
        {
          categoryId: "1",
          activity: 100,
          month: "2022-01",
          budgetId: "123",
        },
        {
          categoryId: "2",
          activity: 200,
          month: "2022-01",
          budgetId: "123",
        },
      ]);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});
