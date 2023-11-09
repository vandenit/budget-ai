import { Category, MonthSummary, MonthTotal } from "@/app/api/budget.server";
import { formatYnabAmount, percentageSpent } from "@/app/utils/ynab";
import Link from "next/link";
import CategoryCard from "./category-card";
import { percentageToStatusClass } from "@/app/utils/styling";
import MonthTotalOverview from "./month-total-overview";
import HiddenProgressBars from "./hidden-progress-bars";
import { MonthlyForcast } from "@/app/api/es-forcasting.server";

type Props = {
  budgetId: string;
  categories: Category[];
  monthSummary: MonthSummary;
  monthPercentage: number;
  monthTotal: MonthTotal;
  forecast: MonthlyForcast;
};

const sortByCategoryUsage = (a: Category, b: Category) => {
  return percentageSpent(a) - percentageSpent(b);
};

const withBudgetFilter = (category: Category) => {
  return category.budgeted > 0;
};

const CurrentMonth = ({
  categories,
  budgetId,
  monthSummary,
  monthPercentage,
  monthTotal,
  forecast,
}: Props) => {
  return (
    <div className="card-body">
      <h2 className="card-title">{monthSummary.month}</h2>
      <HiddenProgressBars />
      <MonthTotalOverview
        monthTotal={monthTotal}
        monthPercentage={monthPercentage}
        forecast={forecast}
        transactions={monthSummary.overallTransactions}
      />
      <div className="flex flex-wrap mb-2 -mx-2">
        {categories
          .filter(withBudgetFilter)
          .sort(sortByCategoryUsage)
          .map((category) => (
            <CategoryCard
              key={category.categoryId}
              budgetId={budgetId}
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
