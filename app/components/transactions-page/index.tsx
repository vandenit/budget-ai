import Link from "next/link";
import { Suspense } from "react";
import Loading from "../Loading";
import { getFilteredTransactions } from "@/app/api/budget.server";
import { formatYnabAmount } from "@/app/utils/ynab";
import CategorySelect from "./category-select";

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
