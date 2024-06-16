import { CategoryUsage } from "./category";
import { Transaction } from "./transaction/transaction.utils";

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

export type YnabConnection = {
  accessToken: string;
  refreshToken: string;
};

export type YnabUserData = {
  connection: YnabConnection;
};
