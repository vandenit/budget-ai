import {
  Category,
  CategoryUsage,
  MonthSummary,
  emptyCategory,
} from "@/app/api/budget.server";

type Props = {
  month: MonthSummary;
  categories: Category[];
  hideBalance?: boolean;
};

const formatYnabAmount = (amount: number) => {
  return (amount / 1000).toFixed(2) + "€";
};

const sortByCategoryAmount = (a: CategoryUsage, b: CategoryUsage) => {
  return a.amount - b.amount;
};

const MonthSummaryBlock = ({ month, categories, hideBalance }: Props) => {
  const getCategory = (categoryName: string): Category => {
    return (
      categories.find((category) => category.categoryName === categoryName) ||
      emptyCategory
    );
  };
  const balanceHeader = hideBalance ? (
    ""
  ) : (
    <th className="px-6 py-4">Balance</th>
  );
  const balanceColumn = (category: CategoryUsage) =>
    hideBalance ? (
      ""
    ) : (
      <td>{formatYnabAmount(getCategory(category.category).balance)}</td>
    );
  return (
    <div key={month.month} className="card w-auto bg-base-100 shadow-xl m-10">
      <div className="card-body">
        <h2 className="card-title">{month.month}</h2>

        <table className="table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount</th>
              {balanceHeader}
            </tr>
          </thead>
          <tbody>
            {month.categoryUsage.sort(sortByCategoryAmount).map((category) => (
              <tr key={category.category}>
                <td>{category.category}</td>
                <td>{formatYnabAmount(category.amount)}</td>
                {balanceColumn(category)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonthSummaryBlock;
