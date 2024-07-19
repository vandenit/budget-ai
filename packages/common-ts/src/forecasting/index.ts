export type CategoryData = {
  categoryId: string;
  typicalSpendingPattern: number; // A weight from 0 (start of month) to 1 (end of month)
  historicalAverage: number;
};

export type TransactionData = {
  date: Date;
  amount: number;
  categoryId: string;
  categoryName: string;
};

export type MonthlySpending = {
  month: Date;
  amount: number;
};

export type MonthlyForcast = {
  totalSpentSoFar: number;
  predictedSpendingEndOfMonth: number;
  predictedRemainingPerDay: number;
  actualRemainingPerDay: number;
  predictedRemainingAmount: number;
  remainingDays: number;
  available: number;
  extraAmountNeeded: number;
};
