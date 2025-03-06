import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Loading from "../Loading";
import MonthSummaryBlock from "./month-summary-block";
import CurrentMonth from "./current-month";

import YnabLoginPage from "../ynab-login-page";
import { getBudget, getBudgetOverviewForUser } from "../../api/budget/budget.client";
import { savePreferredBudget } from "../../api/user/user.client";
import type { PredictionData } from '@/app/budgets/[budgetUuid]/predictions/prediction-data.server';
import { getPrediction } from "@/app/api/math.client";

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
  const { monthPercentage, monthSummaries, categories, monthTotal, forecast } = await getBudgetOverviewForUser(budgetUuid);

  // Fetch prediction data
  let predictionData: PredictionData | undefined;
  try {
    predictionData = await getPrediction(budgetUuid);
  } catch (error) {
    console.error('Error fetching prediction data:', error);
  }

  const aiResponse = { response: "AI response" };

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
            predictionData={predictionData}
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
