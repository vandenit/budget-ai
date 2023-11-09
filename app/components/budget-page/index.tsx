import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Loading from "../Loading";
import {
  calculateCurrentMontPercentage,
  calculateTotals,
  getCategories,
  getMonthSummaries,
} from "@/app/api/budget.server";
import MonthSummaryBlock from "./month-summary-block";
import CurrentMonth from "./current-month";
import { c } from "vitest/dist/reporters-5f784f42.js";
import {
  categoriesToCategoryData,
  forecastSpendingWithES,
} from "@/app/api/es-forcasting.server";

export default function BudgetPage({ budgetId }: { budgetId: string }) {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <BudgetInfo budgetId={budgetId} />
      </Suspense>
    </>
  );
}

async function BudgetInfo({ budgetId }: { budgetId: string }) {
  const monthPercentage = calculateCurrentMontPercentage();
  const monthSummaries = await getMonthSummaries(budgetId);
  //const aiResponse = await getAIAnalysis(monthSummaries);
  const aiResponse = { response: "AI response" };
  const categories = await getCategories(budgetId);
  const monthTotal = calculateTotals(categories);
  const categoryData = categoriesToCategoryData(categories, monthSummaries);
  const forecast = forecastSpendingWithES(categoryData);
  console.log(JSON.stringify(forecast));
  if (monthSummaries.length === 0) {
    redirect("/login");
  }
  return (
    <>
      <h1>Month overview</h1>
      <div className="chat chat-start">
        <div className="chat-bubble">{aiResponse.response}</div>
      </div>
      <div className="mb-4 -mx-2">
        <CurrentMonth
          budgetId={budgetId}
          monthSummary={monthSummaries[0]}
          categories={categories}
          monthPercentage={monthPercentage}
          monthTotal={monthTotal}
          forecast={forecast}
        />
      </div>
      <div className="flex flex-wrap mb-4 -mx-2">
        {monthSummaries
          .filter((month) => !month.isCurrentMonth)
          .map((month) => (
            <MonthSummaryBlock
              budgetId={budgetId}
              month={month}
              categories={categories}
              key={month.month}
            />
          ))}
      </div>
    </>
  );
}
