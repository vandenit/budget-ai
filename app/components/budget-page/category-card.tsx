import { Category } from "@/app/api/budget.server";
import { percentageToStatusClass } from "@/app/utils/styling";
import { formatYnabAmount, percentageSpent } from "@/app/utils/ynab";
import Link from "next/link";
import { format } from "path";

interface StatusIndicatorProps {
  category: Category;
  budgetId: string;
  currentMonthLbl: string;
}

const CategoryCard: React.FC<StatusIndicatorProps> = ({
  category,
  budgetId,
  currentMonthLbl,
}) => {
  const budget = formatYnabAmount(category.budgeted);
  const spent = formatYnabAmount(category.activity);
  const percentage = percentageSpent(category);

  const statusClass = percentageToStatusClass(percentage);
  return (
    <div className="card w-64 bg-base-100 shadow-xl mb-5 mx-2">
      <div className="card-body">
        <h2 className="card-title">{category.categoryName}</h2>
        <Link
          className="link"
          href={`${budgetId}/transactions?month=${currentMonthLbl}&categoryId=${category.categoryId}`}
        >
          <div className={`mx-3 badge badge-${statusClass} badge-outline`}>
            {formatYnabAmount(category.activity, true)} -{" "}
            {formatYnabAmount(category.balance)}
          </div>
        </Link>
        <progress
          className={`progress progress-${statusClass} w-56`}
          value={percentage}
          max="100"
        ></progress>
      </div>
    </div>
  );
};

export default CategoryCard;
