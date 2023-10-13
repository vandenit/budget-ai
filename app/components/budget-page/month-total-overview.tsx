import { Category, MonthTotal } from "@/app/api/budget.server";
import { percentageToStatusClass } from "@/app/utils/styling";
import {
  formatYnabAmount,
  percentageSpent,
  totalPercentageSpent,
} from "@/app/utils/ynab";
import { format } from "path";

interface StatusIndicatorProps {
  category: Category;
}

type Props = {
  monthTotal: MonthTotal;
};
const MonthTotalOverview = ({ monthTotal }: Props) => {
  const percentage = totalPercentageSpent(monthTotal);

  const statusClass = percentageToStatusClass(percentage);
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Total activity</th>
          <th>Total balance</th>
          <th>Total budgeted</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{formatYnabAmount(monthTotal.totalActivity, true)}</td>
          <td>{formatYnabAmount(monthTotal.totalBalance)}</td>
          <td>{formatYnabAmount(monthTotal.totalBudgeted)}</td>
          <td>
            <progress
              className={`progress progress-${statusClass} w-56`}
              value={percentage}
              max="100"
            ></progress>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default MonthTotalOverview;
