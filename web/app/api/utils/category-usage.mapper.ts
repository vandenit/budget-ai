import { Category, CategoryUsage } from "../category/category.utils";

export const categoryUsageMapper =
  (budgetId: string) =>
  (categoryUsage: CategoryUsage): Category => ({
    // since we are not sure it is the current month: budgeted, targetAmount and balance are set to 0
    name: categoryUsage.name,
    uuid: categoryUsage.uuid || "",
    balance: categoryUsage.amount,
    budgeted: 0,
    activity: categoryUsage.amount,
    targetAmount: 0,
    budgetId: `${budgetId}`,
  });
