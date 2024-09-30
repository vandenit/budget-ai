"use client";
import Link from "next/link";
import Progress from "../progress";
import {
  Category,
  calculatePercentage,
  formatAmount,
  formatPercentage,
  MonthTotal,
  percentageSpent,
  isInflowCategory
} from "common-ts";
import { percentageToStatusClass } from "../../utils";

interface StatusIndicatorProps {
  category: Category;
  budgetUuid: string;
  currentMonthLbl: string;
  monthTotal: MonthTotal;
}

import { useState } from "react";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";

const CategoryCard: React.FC<StatusIndicatorProps> = ({
  category,
  budgetUuid,
  currentMonthLbl,
  monthTotal,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const percentage = percentageSpent(category);
  const statusClass = percentageToStatusClass(percentage);

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="w-full sm:w-1/2 md:w-1/3 mb-5">
      <div className="card mx-2 bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h2 className="card-title">
              <Link
                className="link"
                href={`/budgets/${budgetUuid}/transactions?month=${currentMonthLbl}&categoryUuid=${category.uuid}`}
              >
                {category.name}
              </Link>{" "}
            </h2>
            <PercentageBadget category={category} />
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleToggleCollapse}
            >
              {isCollapsed ? <FaAngleDown /> : <FaAngleUp />}
            </button>
          </div>
          {!isCollapsed && (
            <>
              {!isInflowCategory(category) && (
                <ExpenseCategoryCard
                  category={category}
                  monthTotal={monthTotal}
                />
              )}
              {isInflowCategory(category) && (
                <InflowCategoryCard category={category} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ExpenseCategoryCard = ({
  category,
  monthTotal,
}: {
  category: Category;
  monthTotal: MonthTotal;
}) => {
  const budget = formatAmount(category.budgeted);
  const spent = formatAmount(category.activity, true);
  const percentage = percentageSpent(category);
  const statusClass = percentageToStatusClass(percentage);
  return (
    <>
      <table className="table w-full">
        <tbody>
          <tr>
            <td>Available</td>
            <td>{formatAmount(category.balance)}</td>
            <td>
              <Progress
                percentage={calculatePercentage(
                  category.balance,
                  monthTotal.totalBalance
                )}
              />
            </td>
          </tr>
          <tr>
            <td>Budgeted</td>
            <td>{budget}</td>
            <td>
              <Progress
                percentage={calculatePercentage(
                  category.budgeted,
                  monthTotal.totalBudgeted
                )}
              />
            </td>
          </tr>
          <tr>
            <td>Spent</td>
            <td>{spent}</td>
            <td>
              <Progress
                percentage={calculatePercentage(
                  category.activity,
                  monthTotal.totalSpent
                )}
              />
            </td>
          </tr>
        </tbody>
      </table>
      <progress
        className={`progress progress-${statusClass} w-56`}
        value={percentage}
        max="100"
      ></progress>
    </>
  );
};

const PercentageBadget = ({ category }: { category: Category }) => {
  const percentage = percentageSpent(category);
  const statusClass = percentageToStatusClass(percentage);
  return (
    <span className={`mx-3 badge badge-${statusClass} badge-outline`}>
      {formatPercentage(percentage)}
    </span>
  );
}

const InflowCategoryCard = ({ category }: { category: Category }) => (
  <>
    <table className="table w-full">
      <tbody>
        <tr>
          <td>Activity</td>
          <td>{formatAmount(category.activity)}</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </>
);
export default CategoryCard;
