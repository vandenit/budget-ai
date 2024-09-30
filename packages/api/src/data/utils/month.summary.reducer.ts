import { MonthSummary, Transaction } from "common-ts";
import { CategoryHistory } from "../category/category.server";

export const monthSummaryFromCategoryHistoryReducer = (
  monthSummaries: Array<MonthSummary>,
  categoryHistory: CategoryHistory
) => {
  const month = categoryHistory.month;
  const currentMonth = new Date().toISOString().substring(0, 7);
  const monthSummary = monthSummaries.find(
    (summary: MonthSummary) => summary.month === month
  );
  if (monthSummary) {
    monthSummary.categoryUsages.push({
      name: categoryHistory.categoryName,
      uuid: categoryHistory.categoryUuid,
      amount: categoryHistory.activity,
    });
  } else {
    monthSummaries.push({
      month,
      isCurrentMonth: month === currentMonth,
      categoryUsages: [
        {
          name: categoryHistory.categoryName,
          uuid: categoryHistory.categoryUuid,
          amount: categoryHistory.activity,
        },
      ],
    });
  }
  return monthSummaries;
};
