import {
  Category,
  CategoryUsage,
  MonthSummary,
  emptyCategory,
} from "@/app/api/budget.server";
import {
  formatPercentage,
  formatYnabAmount,
  isInflowCategory,
  ynabAbsoluteNumber,
} from "@/app/utils/ynab";
import Link from "next/link";
import CategoryCard from "./category-card";
import { get } from "http";

type Props = {
  budgetId: string;
  month: MonthSummary;
  categories: Category[];
};

const sortByCategoryAmount = (a: CategoryUsage, b: CategoryUsage) => {
  return a.amount - b.amount;
};

const MonthSummaryBlock = ({ month, categories, budgetId }: Props) => {
  const getCategory = (categoryName: string): Category => {
    return (
      categories.find((category) => category.categoryName === categoryName) ||
      emptyCategory
    );
  };

  const getPercentageOverTarget = (category: CategoryUsage) => {
    const targetAmount = getCategory(category.category).targetAmount;
    if (targetAmount === 0) {
      // no target set return 125 to show as error
      return 125;
    }
    // return absolute percentage over target
    return Math.abs(
      Math.round(
        (category.amount / getCategory(category.category).targetAmount) * 100
      )
    );
  };

  const getStatusClassByOverTargetSeverity = (category: CategoryUsage) => {
    if (isInflowCategory(getCategory(category.category))) {
      return "info";
    }
    const percentage = getPercentageOverTarget(category);
    if (percentage < 105) {
      return "success";
    }
    if (percentage < 120) {
      return "warning";
    }
    return "error";
  };

  return (
    <div key={month.month} className="card bg-base-100 shadow-xl m-2">
      <div className="card-body">
        <Link
          className="link"
          href={`${budgetId}/transactions?month=${month.month}`}
        >
          <h2 className="card-title">{month.month}</h2>
        </Link>

        <table className="table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount/Target</th>
            </tr>
          </thead>
          <tbody>
            {month.categoryUsage.sort(sortByCategoryAmount).map((category) => (
              <tr key={category.category}>
                <td>
                  <Link
                    className="link"
                    href={`${budgetId}/transactions?month=${month.month}&categoryId=${category.categoryId}`}
                  >
                    <p>{category.category}</p>
                  </Link>
                </td>
                <td>
                  <p
                    className={`badge badge-${getStatusClassByOverTargetSeverity(
                      category
                    )} badge-outline`}
                  >
                    {formatYnabAmount(category.amount, true)}&nbsp;/&nbsp;
                    {formatYnabAmount(
                      getCategory(category.category).targetAmount
                    )}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonthSummaryBlock;
