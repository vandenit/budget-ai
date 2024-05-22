import { MonthSummary } from "@/app/main.budget.utils";
import { categoryUsageReducer } from "./category.usage.reducer";
import { Transaction } from "../transaction/transaction.utils";

export const monthSummaryReducer = (
  monthSummaries: Array<MonthSummary>,
  transaction: Transaction
) => {
  const month = transaction.date.substring(0, 7);
  const currentMonth = new Date().toISOString().substring(0, 7);
  const monthSummary = monthSummaries.find(
    (summary: MonthSummary) => summary.month === month
  );
  if (monthSummary) {
    monthSummary.categoryUsages = categoryUsageReducer(
      monthSummary.categoryUsages,
      transaction
    );
    monthSummary.overallTransactions.push(transaction);
  } else {
    monthSummaries.push({
      month,
      isCurrentMonth: month === currentMonth,
      categoryUsages: categoryUsageReducer([], transaction),
      overallTransactions: [transaction],
    });
  }
  return monthSummaries;
};
