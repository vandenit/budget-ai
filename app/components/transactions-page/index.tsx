import Link from "next/link";
import { Suspense } from "react";
import Loading from "../Loading";
import { getFilteredTransactions } from "@/app/api/budget.server";
import { formatYnabAmount } from "@/app/utils/ynab";
import CategorySelect from "./category-select";
import { MonthlySpendingChart } from "../charts/mothly-spending-chart";
import { getMonthlySpendingData } from "../charts/util";
import { TestChart } from "../charts/test-chart";

export default function TransactionsPage({
  budgetId,
  categoryId,
  month,
  dayOfMonth,
}: {
  budgetId: string;
  categoryId: string | undefined;
  month: string | undefined;
  dayOfMonth: string | undefined;
}) {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <TransactionsInfo
          budgetId={budgetId}
          categoryId={categoryId}
          month={month}
          dayOfMonth={dayOfMonth}
        />
      </Suspense>
    </>
  );
}

async function TransactionsInfo({
  budgetId,
  categoryId,
  month,
  dayOfMonth,
}: {
  budgetId: string;
  categoryId?: string;
  month?: string;
  dayOfMonth?: string;
}) {
  const transactions = await getFilteredTransactions(
    budgetId,
    categoryId,
    month,
    dayOfMonth
  );
  // explain
  return (
    <>
      <h1>Transactions</h1>
      <CategorySelect
        budgetId={budgetId}
        categoryId={categoryId}
        month={month}
      />
      <>
        <TestChart />
        <table className="table">
          <thead>
            <tr>
              <th>Amount</th>
              <th>Payee</th>
              <th>Date</th>
              <th>Category Name</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{formatYnabAmount(transaction.amount)}</td>
                <td>{transaction.payeeName}</td>
                <td>{transaction.date}</td>
                <td>{transaction.categoryName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    </>
  );
}
