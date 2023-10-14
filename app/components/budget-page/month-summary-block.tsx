import {
  Category,
  CategoryUsage,
  MonthSummary,
  emptyCategory,
} from "@/app/api/budget.server";
import { formatYnabAmount } from "@/app/utils/ynab";
import Link from "next/link";
import CategoryCard from "./category-card";

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

  return (
    <div key={month.month} className="card bg-base-100 shadow-xl m-2">
      <div className="card-body">
        <h2 className="card-title">{month.month}</h2>

        <table className="table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount</th>
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
                    {category.category}
                  </Link>
                </td>
                <td>{formatYnabAmount(category.amount, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonthSummaryBlock;
