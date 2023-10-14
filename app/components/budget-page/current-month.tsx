import { Category, MonthTotal } from "@/app/api/budget.server";
import { formatYnabAmount, percentageSpent } from "@/app/utils/ynab";
import Link from "next/link";
import CategoryCard from "./category-card";
import { percentageToStatusClass } from "@/app/utils/styling";
import MonthTotalOverview from "./month-total-overview";
import HiddenProgressBars from "./hidden-progress-bars";

type Props = {
  budgetId: string;
  categories: Category[];
  currentMonthLbl: string;
  monthPercentage: number;
  monthTotal: MonthTotal;
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
  currentMonthLbl,
  monthPercentage,
  monthTotal,
}: Props) => {
  return (
    <div className="card bg-base-100 shadow-xl m-2">
      <div className="card-body">
        <h2 className="card-title">{currentMonthLbl}</h2>
        <h3>
          Month progress:
          <progress
            className={`progress progress-${percentageToStatusClass(
              monthPercentage
            )} w-56`}
            value={monthPercentage}
            max="100"
          ></progress>
          <HiddenProgressBars />
        </h3>
        <MonthTotalOverview monthTotal={monthTotal} />
        <div className="flex flex-wrap mb-2 -mx-2">
          {categories
            .filter(withBudgetFilter)
            .sort(sortByCategoryUsage)
            .map((category) => (
              <CategoryCard
                key={category.categoryId}
                budgetId={budgetId}
                currentMonthLbl={currentMonthLbl}
                category={category}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export default CurrentMonth;
