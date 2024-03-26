import { Category, CategoryUsage } from "../budget.server";

export const categoryUsageMapper =
  (budgetId: string) =>
  (categoryUsage: CategoryUsage): Category => ({
    // since we are not sure it is the current month: budgeted, targetAmount and balance are set to 0
    categoryName: categoryUsage.categoryName,
    categoryId: categoryUsage.categoryId || "",
    balance: categoryUsage.amount,
    budgeted: 0,
    activity: categoryUsage.amount,
    targetAmount: 0,
    budgetId,
  });
