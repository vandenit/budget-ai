import { CategoryUsage } from "./api/category/category.utils";
import { Transaction } from "./api/transaction/transaction.utils";

export type MonthTotal = {
  totalSpent: number;
  totalBudgeted: number;
  totalBalance: number;
};

export type MonthSummary = {
  month: string;
  isCurrentMonth: boolean;
  categoryUsages: Array<CategoryUsage>;
  overallTransactions: Array<Transaction>;
};
