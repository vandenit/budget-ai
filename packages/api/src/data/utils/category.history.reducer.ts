import { Transaction } from "common-ts";
import { CategoryHistoryForInsert } from "../category/category.server";

export const CategoryHistoryReducer =
  (budgetId: string) =>
  (
    categoryHistories: Array<CategoryHistoryForInsert>,
    transaction: Transaction
  ) => {
    const categoryId = `${transaction.categoryId}` || "";
    const month = transaction.date.substring(0, 7);
    const startDateOfMonth = new Date(`${month}-01`);
    const categoryHistory = categoryHistories.find(
      (categoryHistory: CategoryHistoryForInsert) =>
        `${categoryHistory.categoryId}` === categoryId &&
        categoryHistory.month === month
    );
    if (categoryHistory) {
      categoryHistory.activity += transaction.amount;
    } else {
      categoryHistories.push({
        categoryId,
        month,
        budgetId,
        activity: transaction.amount,
      });
    }
    return categoryHistories;
  };
