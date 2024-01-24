import Link from "next/link";
import { Suspense, useState } from "react";
import Loading from "../Loading";
import {
  getCategoriesContainingTransactions,
  getFilteredTransactions,
} from "@/app/api/budget.server";
import TransactionContent from "./transaction-content";

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
    month,
    dayOfMonth
  );
  const categories = await getCategoriesContainingTransactions(
    budgetId,
    transactions
  );
  return (
    <TransactionContent
      budgetId={budgetId}
      categoryId={categoryId}
      month={month}
      categories={categories}
      transactions={transactions}
    />
  );
}
