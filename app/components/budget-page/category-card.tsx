import { Category, MonthTotal } from "@/app/api/budget.server";
import { percentageToStatusClass } from "@/app/utils/styling";
import {
  calculatePercentage,
  formatPercentage,
  formatYnabAmount,
  isInflowCategory,
  percentageSpent,
} from "@/app/utils/ynab";
import Link from "next/link";
import Progress from "../progress";

interface StatusIndicatorProps {
  category: Category;
  budgetId: string;
  currentMonthLbl: string;
  monthTotal: MonthTotal;
}

const CategoryCard: React.FC<StatusIndicatorProps> = ({
  category,
  budgetId,
  currentMonthLbl,
  monthTotal,
}) => {
  const percentage = percentageSpent(category);

  const statusClass = percentageToStatusClass(percentage);
  return (
    <div className="w-full sm:w-1/2 md:w-1/3  mb-5">
      <div className="card mx-2 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">
            <Link
              className="link"
              href={`${budgetId}/transactions?month=${currentMonthLbl}&categoryId=${category.categoryId}`}
            >
              {category.categoryName}
            </Link>{" "}
          </h2>
          {!isInflowCategory(category) && (
            <ExpenseCategoryCard category={category} monthTotal={monthTotal} />
          )}
          {isInflowCategory(category) && (
            <InflowCategoryCard category={category} />
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
  const budget = formatYnabAmount(category.budgeted);
  const spent = formatYnabAmount(category.activity, true);
  const percentage = percentageSpent(category);
  const statusClass = percentageToStatusClass(percentage);
  return (
    <>
      <table className="table w-full">
        <tbody>
          <tr>
            <td>Available</td>
            <td>{formatYnabAmount(category.balance)}</td>
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
                  monthTotal.totalActivity
                )}
              />
            </td>
          </tr>
        </tbody>
      </table>
      <span className={`mx-3 badge badge-${statusClass} badge-outline`}>
        {formatPercentage(percentage)}
      </span>
      <progress
        className={`progress progress-${statusClass} w-56`}
        value={percentage}
        max="100"
      ></progress>
    </>
  );
};

const InflowCategoryCard = ({ category }: { category: Category }) => (
  <>
    <table className="table w-full">
      <tbody>
        <tr>
          <td>Activity</td>
          <td>{formatYnabAmount(category.activity)}</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </>
);
export default CategoryCard;
