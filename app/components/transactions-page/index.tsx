import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Loading from "../Loading";
import {
  getCategories,
  getFilteredTransactions,
  getMonthSummaries,
  getTransactions,
} from "@/app/api/budget.server";
import { formatYnabAmount } from "@/app/utils/ynab";

export default function TransactionsPage({
  budgetId,
  categoryId,
  month,
}: {
  budgetId: string;
  categoryId: string | undefined;
  month: string | undefined;
}) {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <TransactionsInfo
          budgetId={budgetId}
          categoryId={categoryId}
          month={month}
        />
      </Suspense>
    </>
  );
}

async function TransactionsInfo({
  budgetId,
  categoryId,
  month,
}: {
  budgetId: string;
  categoryId?: string;
  month?: string;
}) {
  const transactions = await getFilteredTransactions(
    budgetId,
    categoryId,
    month
  );

  return (
    <>
      <h1>Transactions</h1>
      <h2>{categoryId}</h2>
      <h2>{month}</h2>
      <>
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
