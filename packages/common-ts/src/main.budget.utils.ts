import { Category, CategoryUsage } from "./category";
import { MonthlyForcast } from "./forecasting";
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

/** budget overview containing:
 *  monthPercentage,
    monthSummaries,
    categories,
    monthTotal,
    forecast
    */
export type BudgetOverview = {
  monthPercentage: number;
  monthSummaries: Array<MonthSummary>;
  categories: Array<Category>;
  monthTotal: MonthTotal;
  forecast: MonthlyForcast;
};
