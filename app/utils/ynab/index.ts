import { Category, MonthTotal } from "@/app/api/budget.server";

export const formatYnabAmount = (amount: number, absolute: boolean = false) => {
  const number = absolute ? Math.abs(amount) : amount;
  return (number / 1000).toFixed(2) + "€";
};

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
  return (absAmount / absBudget) * 100;
};

export const formatPercentage = (percentage: number) =>
  percentage.toFixed(2) + "%";

export const totalPercentageSpent = (total: MonthTotal) => {
  const absAmount = ynabAbsoluteNumber(total.totalActivity);
  const absBudget = ynabAbsoluteNumber(total.totalBudgeted);
  if (absBudget === 0) {
    return 100;
  }
  return (absAmount / absBudget) * 100;
};
