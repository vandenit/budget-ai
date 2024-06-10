import Link from "next/link";
import CategoryCard from "./category-card";
import MonthTotalOverview from "./month-total-overview";
import HiddenProgressBars from "./hidden-progress-bars";
import { Category, MonthlyForcast, MonthSummary, MonthTotal, percentageSpent } from "common-ts";

type Props = {
  budgetUuid: string;
  categories: Category[];
  monthSummary: MonthSummary;
  monthPercentage: number;
  monthTotal: MonthTotal;
  forecast: MonthlyForcast;
};

const sortByCategoryUsageWithInflowNameFirst = (a: Category, b: Category) => {
  if (a.name.toLowerCase().includes("inflow")) {
    return -1;
  }
  if (b.name.toLowerCase().includes("inflow")) {
    return 1;
  }
  return percentageSpent(a) - percentageSpent(b);
};

const withBudgetFilter = (category: Category) => {
  return category.budgeted >= 0;
};

const CurrentMonth = ({
  categories,
  budgetUuid,
  monthSummary,
  monthPercentage,
  monthTotal,
  forecast,
}: Props) => {
  return (
    <div className="card-body">
      <h2 className="card-title">
        <Link
          className="link"
          href={`/budgets/${budgetUuid}/transactions?month=${monthSummary.month}`}
        >
          {monthSummary.month}
        </Link>
      </h2>
      <HiddenProgressBars />
      <MonthTotalOverview
        month={monthSummary.month}
        monthTotal={monthTotal}
        monthPercentage={monthPercentage}
        forecast={forecast}
        categories={categories}
        budgetUuid={budgetUuid}
      />
      <div className="flex flex-wrap mb-2 -mx-2">
        {categories
          .filter(withBudgetFilter)
          .sort(sortByCategoryUsageWithInflowNameFirst)
          .map((category) => (
            <CategoryCard
              key={category.uuid}
              budgetUuid={budgetUuid}
              currentMonthLbl={monthSummary.month}
              category={category}
              monthTotal={monthTotal}
            />
          ))}
      </div>
    </div>
  );
};

export default CurrentMonth;
