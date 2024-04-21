import { describe, expect, it } from "vitest";
import { categoryUsageMapper } from "../../../../app/api/utils/category-usage.mapper";
import { CategoryUsage } from "@/app/api/category/category.utils";

describe("categoryUsageMapper", () => {
  it("should map a category usage object to a category", () => {
    const categoryUsage: CategoryUsage = {
      name: "Groceries",
      uuid: "123",
      amount: 100,
      transactions: [],
    };
    const mapper = categoryUsageMapper("456");
    expect(mapper(categoryUsage)).toEqual({
      name: "Groceries",
      uuid: "123",
      balance: 100,
      budgeted: 0,
      activity: 100,
      targetAmount: 0,
      budgetId: "456",
    });
  });
});
