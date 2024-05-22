import { Category } from "@/app/api/category/category.utils";
import { MonthTotal } from "@/app/main.budget.utils";

export const formatBasicAmount = (
  amount: number,
  absolute: boolean = false
) => {
  const number = absolute ? Math.abs(amount) : amount;
  return number.toFixed(2) + "€";
};
export const formatAmount = (amount: number, absolute: boolean = false) =>
  formatBasicAmount(amount / 1000, absolute);

export const numberD1000 = (amount: number) => {
  return amount / 1000;
};

export const absoluteD1000Number = (amount: number) => {
  return Math.abs(numberD1000(amount));
};

export const percentageSpent = (category: Category) => {
  const absAmount = absoluteD1000Number(category.activity);
  const absBudget = absoluteD1000Number(category.budgeted);
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
  const absAmount = absoluteD1000Number(total.totalSpent);
  const absBudget = absoluteD1000Number(total.totalBudgeted);
  if (absBudget === 0) {
    return 100;
  }
  return calculatePercentage(absAmount, absBudget);
};
