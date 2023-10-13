import { Category, MonthTotal } from "@/app/api/budget.server";
import { formatYnabAmount, percentageSpent } from "@/app/utils/ynab";
import Link from "next/link";
import StatusIndicator from "./status-indicator";
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
        <table className="table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount</th>
              <th>Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {categories
              .filter(withBudgetFilter)
              .sort(sortByCategoryUsage)
              .map((category) => (
                <tr key={category.categoryId}>
                  <td>
                    <Link
                      className="link"
                      href={`${budgetId}/transactions?month=${currentMonthLbl}&categoryId=${category.categoryId}`}
                    >
                      {category.categoryName}
                    </Link>
                  </td>
                  <td>{formatYnabAmount(category.activity, true)}</td>
                  <td>{formatYnabAmount(category.balance)}</td>
                  <td>
                    <StatusIndicator category={category} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CurrentMonth;
