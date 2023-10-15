import { Category, MonthTotal } from "@/app/api/budget.server";
import { percentageToStatusClass } from "@/app/utils/styling";
import { formatYnabAmount, totalPercentageSpent } from "@/app/utils/ynab";
import { format } from "path";

type Props = {
  monthTotal: MonthTotal;
  monthPercentage: number;
};
const MonthTotalOverview = ({ monthTotal, monthPercentage }: Props) => {
  const percentage = totalPercentageSpent(monthTotal);

  const statusClass = percentageToStatusClass(percentage);
  return (
    <div className="card bg-base-100 shadow-xl mb-5">
      <div className="card-body p-0.5 sm:p-5">
        <table className="table w-80">
          <thead>
            <tr>
              <th>Total activity</th>
              <th>Total available</th>
              <th>Total budgeted</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{formatYnabAmount(monthTotal.totalActivity, true)}</td>
              <td>{formatYnabAmount(monthTotal.totalBalance)}</td>
              <td>{formatYnabAmount(monthTotal.totalBudgeted)}</td>
            </tr>
            <tr>
              <td>Month Progress</td>
              <td colSpan={2}>
                <progress
                  className={`progress progress-${percentageToStatusClass(
                    monthPercentage
                  )}`}
                  value={monthPercentage}
                  max="100"
                ></progress>
              </td>
            </tr>
            <tr>
              <td>Budget Progress</td>
              <td colSpan={2}>
                <progress
                  className={`progress progress-${percentageToStatusClass(
                    percentage
                  )}`}
                  value={percentage}
                  max="100"
                ></progress>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonthTotalOverview;
