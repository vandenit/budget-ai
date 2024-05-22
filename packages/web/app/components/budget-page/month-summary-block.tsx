import Link from "next/link";
import CategoryCard from "./category-card";
import { get } from "http";
import {
  Category,
  CategoryUsage,
  emptyCategory,
  isInflowCategory,
} from "@/app/api/category/category.utils";
import { formatAmount } from "@/app/utils/amounts";
import { MonthSummary } from "@/app/main.budget.utils";

type Props = {
  budgetUuid: string;
  month: MonthSummary;
  categories: Category[];
};

const sortByCategoryAmount = (a: CategoryUsage, b: CategoryUsage) => {
  return a.amount - b.amount;
};

const MonthSummaryBlock = ({ month, categories, budgetUuid }: Props) => {
  const getCategory = (categoryName: string): Category => {
    return (
      categories.find((category) => category.name === categoryName) ||
      emptyCategory
    );
  };

  const getPercentageOverTarget = (category: CategoryUsage) => {
    const targetAmount = getCategory(category.name).targetAmount;
    if (targetAmount === 0) {
      // no target set return 125 to show as error
      return 125;
    }
    // return absolute percentage over target
    return Math.abs(
      Math.round(
        (category.amount / getCategory(category.name).targetAmount) * 100
      )
    );
  };

  const getStatusClassByOverTargetSeverity = (category: CategoryUsage) => {
    if (isInflowCategory(getCategory(category.name))) {
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
          href={`/budgets/${budgetUuid}/transactions?month=${month.month}`}
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
            {month.categoryUsages
              .sort(sortByCategoryAmount)
              .map((categoryUsage) => (
                <tr key={categoryUsage.name}>
                  <td>
                    <Link
                      className="link"
                      href={`/budgets/${budgetUuid}/transactions?month=${month.month}&categoryUuid=${categoryUsage.uuid}`}
                    >
                      <p>{categoryUsage.name}</p>
                    </Link>
                  </td>
                  <td>
                    <p
                      className={`badge badge-${getStatusClassByOverTargetSeverity(
                        categoryUsage
                      )} badge-outline`}
                    >
                      {formatAmount(categoryUsage.amount, true)}
                      &nbsp;/&nbsp;
                      {formatAmount(
                        getCategory(categoryUsage.name).targetAmount
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
