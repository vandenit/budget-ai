import { Category, MonthTotal } from "@/app/api/budget.server";

export const isInflowCategory = (category: Category) => {
  return category.categoryName.startsWith("Inflow");
};

export const formatAmount = (amount: number, absolute: boolean = false) => {
  const number = absolute ? Math.abs(amount) : amount;
  return number.toFixed(2) + "€";
};
export const formatYnabAmount = (amount: number, absolute: boolean = false) =>
  formatAmount(amount / 1000, absolute);

export const ynabNumber = (amount: number) => {
  return amount / 1000;
};

export const ynabAbsoluteNumber = (amount: number) => {
  return Math.abs(ynabNumber(amount));
};

export const percentageSpent = (category: Category) => {
  const absAmount = ynabAbsoluteNumber(category.activity);
  const absBudget = ynabAbsoluteNumber(category.budgeted);
  if (absBudget === 0) {
    return 100;
  }
  return calculatePercentage(absAmount, absBudget);
};

export const calculatePercentage = (amount: number, total: number) =>
  (amount / total) * 100;

export const formatPercentage = (percentage: number) =>
  percentage.toFixed(2) + "%";

export const totalPercentageSpent = (total: MonthTotal) => {
  const absAmount = ynabAbsoluteNumber(total.totalSpent);
  const absBudget = ynabAbsoluteNumber(total.totalBudgeted);
  if (absBudget === 0) {
    return 100;
  }
  return calculatePercentage(absAmount, absBudget);
};
