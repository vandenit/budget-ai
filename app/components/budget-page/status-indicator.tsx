import { Category } from "@/app/api/budget.server";
import { percentageToStatusClass } from "@/app/utils/styling";
import { formatYnabAmount, percentageSpent } from "@/app/utils/ynab";
import { format } from "path";

interface StatusIndicatorProps {
  category: Category;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ category }) => {
  const budget = formatYnabAmount(category.budgeted);
  const spent = formatYnabAmount(category.activity);
  const percentage = percentageSpent(category);

  const statusClass = percentageToStatusClass(percentage);
  return (
    <progress
      className={`progress progress-${statusClass} w-56`}
      value={percentage}
      max="100"
    ></progress>
  );
};

export default StatusIndicator;
