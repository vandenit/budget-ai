import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Loading from "../Loading";
import {
  calculateCurrentMontPercentage,
  calculateTotals,
  getMonthSummaries,
} from "../../api/main.budget.client";
import MonthSummaryBlock from "./month-summary-block";
import CurrentMonth from "./current-month";

import { savePreferredBudget } from "../../api/user/user.server";
import { getCategories } from "../../api/category/category.server";
import YnabLoginPage from "../ynab-login-page";
import { categoriesToCategoryData, forecastSpendingWithES } from "../../api/es-forcasting.server";
import { getBudget } from "../../api/budget/budget.client";

export default function BudgetPage({ budgetUuid }: { budgetUuid: string }) {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <BudgetInfo budgetUuid={budgetUuid} />
      </Suspense>
    </>
  );
}

async function BudgetInfo({ budgetUuid: budgetUuid }: { budgetUuid: string }) {
  savePreferredBudget(budgetUuid);
  const budget = await getBudget(budgetUuid);
  if (!budget) {
    return <YnabLoginPage />;
  }
  const monthPercentage = calculateCurrentMontPercentage();
  const monthSummaries = await getMonthSummaries(budgetUuid);
  // const aiResponse = await getAIAnalysis(monthSummaries);
  const aiResponse = { response: "AI response" };
  const categories = await getCategories(budgetUuid);
  const monthTotal = calculateTotals(categories);
  const categoryData = categoriesToCategoryData(categories, monthSummaries);
  const forecast = forecastSpendingWithES(categoryData);
  if (monthSummaries.length === 0) {
    return <YnabLoginPage />;
  }
  const currentMonth = monthSummaries.find((month) => month.isCurrentMonth);
  return (
    <>
      <h1 className="text-center">{budget.name}</h1>
      {currentMonth && (
        <div className="mb-4 -mx-2">
          <CurrentMonth
            budgetUuid={budgetUuid}
            monthSummary={currentMonth}
            categories={categories}
            monthPercentage={monthPercentage}
            monthTotal={monthTotal}
            forecast={forecast}
          />
        </div>
      )}
      <div className="flex flex-wrap mb-4 -mx-2">
        {monthSummaries
          .filter((month) => !month.isCurrentMonth)
          .map((month) => (
            <MonthSummaryBlock
              budgetUuid={budgetUuid}
              month={month}
              categories={categories}
              key={month.month}
            />
          ))}
      </div>
    </>
  );
}
