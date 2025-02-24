"use client";
import {
  MonthTotal, Category, formatAmount,
  totalPercentageSpent, MonthlyForcast
} from "common-ts";
import Link from "next/link";
import { CategoryPieChart } from "../charts/category-pie-chart";
import { PredictionChart } from "../charts/prediction-chart";
import { percentageToStatusClass } from "../../utils";
import { useState } from "react";

type Props = {
  budgetUuid: string;
  month: string;
  monthTotal: MonthTotal;
  monthPercentage: number;
  forecast: MonthlyForcast;
  categories: Category[];
};

type TabType = "categories" | "prediction";

const MonthTotalOverview = ({
  budgetUuid,
  month,
  monthTotal,
  monthPercentage,
  forecast,
  categories,
}: Props) => {
  const [selectedTab, setSelectedTab] = useState<TabType>("categories");
  const percentage = totalPercentageSpent(monthTotal);

  const statusClass = percentageToStatusClass(percentage);
  return (
    <div className="card bg-base-100 shadow-xl mb-5">
      <div className="card-body p-0.5 sm:p-5">
        <div className="flex flex-wrap w-full">
          <div className="w-full md:w-1/2 lg:w-1/2 mb-5 md:mb-0">
            <TotalTable
              monthTotal={monthTotal}
              forecast={forecast}
              percentage={percentage}
              monthPercentage={monthPercentage}
            />
          </div>
          <div className="w-full md:w-1/2 lg:w-1/2">
            <div className="flex justify-between items-center mb-4">
              <div className="tabs tabs-boxed justify-center">
                <button
                  className={`tab ${selectedTab === "categories" ? "tab-active" : ""}`}
                  onClick={() => setSelectedTab("categories")}
                >
                  Categories
                </button>
                <button
                  className={`tab ${selectedTab === "prediction" ? "tab-active" : ""}`}
                  onClick={() => setSelectedTab("prediction")}
                >
                  Prediction
                </button>
              </div>
              {selectedTab === "prediction" && (
                <Link
                  href={`/budgets/${budgetUuid}/predictions`}
                  className="btn btn-primary btn-sm gap-2"
                  title="View detailed predictions"
                >
                  <span>Details</span>
                  <span className="text-lg">📈</span>
                </Link>
              )}
            </div>

            {selectedTab === "categories" && (
              <CategoryPieChart
                month={month}
                categories={categories}
                budgetUuid={budgetUuid}
              />
            )}
            {selectedTab === "prediction" && (
              <div className="group relative">
                <PredictionChart
                  forecast={forecast}
                  categories={categories}
                  budgetId={budgetUuid}
                />
                <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/budgets/${budgetUuid}/predictions`}
                    className="btn btn-circle btn-ghost btn-sm"
                    title="View detailed predictions"
                  >
                    <span className="text-lg">📈</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TotalTable = ({
  monthTotal,
  forecast,
  monthPercentage,
  percentage,
}: {
  monthTotal: MonthTotal;
  forecast: MonthlyForcast;
  monthPercentage: number;
  percentage: number;
}) => {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Total spent</th>
          <th>Total available</th>
          <th>Total budgeted</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{formatAmount(monthTotal.totalSpent, true)}</td>
          <td>{formatAmount(monthTotal.totalBalance)}</td>
          <td>{formatAmount(monthTotal.totalBudgeted)}</td>
        </tr>
        <tr>
          <td>Month Progress</td>
          <td colSpan={2}>
            <progress
              className={`progress progress-${percentageToStatusClass(
                monthPercentage
              )}`}
              value={monthPercentage}
              max="100"
            ></progress>
          </td>
        </tr>
        <tr>
          <td>Budget Progress</td>
          <td colSpan={2}>
            <progress
              className={`progress progress-${percentageToStatusClass(
                percentage
              )}`}
              value={percentage}
              max="100"
            ></progress>
          </td>
        </tr>
        <tr>
          <td>Forecasted Remaining amount</td>
          <td colSpan={2}>
            {formatAmount(forecast.predictedRemainingAmount)}
          </td>
        </tr>
        <tr>
          <td>Forecasted Daily amount</td>
          <td colSpan={2}>
            {formatAmount(forecast.predictedRemainingPerDay)}
          </td>
        </tr>
        <tr>
          <td>Actual Remaing per day amount</td>
          <td colSpan={2}>
            {formatAmount(forecast.actualRemainingPerDay)}
          </td>
        </tr>
        <tr>
          <td>Extra suggested</td>
          <td colSpan={2}>{formatAmount(forecast.extraAmountNeeded)}</td>
        </tr>
      </tbody>
    </table>
  );
};
export default MonthTotalOverview;
