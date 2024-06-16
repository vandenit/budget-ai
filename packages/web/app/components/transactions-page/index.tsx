import Link from "next/link";
import { Suspense, useState } from "react";
import Loading from "../Loading";
import {
  getCategoriesContainingTransactions,
  getCategoriesFromTransactions,
  getFilteredTransactions,
} from "../../api/main.budget.client";
import TransactionContent from "./transaction-content";

export default function TransactionsPage({
  budgetUuid,
  categoryUuid,
  month,
  dayOfMonth,
}: {
  budgetUuid: string;
  categoryUuid: string | undefined;
  month: string | undefined;
  dayOfMonth: string | undefined;
}) {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <TransactionsInfo
          budgetUuid={budgetUuid}
          categoryUuid={categoryUuid}
          month={month}
          dayOfMonth={dayOfMonth}
        />
      </Suspense>
    </>
  );
}

async function TransactionsInfo({
  budgetUuid,
  categoryUuid,
  month,
  dayOfMonth,
}: {
  budgetUuid: string;
  categoryUuid?: string;
  month?: string;
  dayOfMonth?: string;
}) {
  const transactions = await getFilteredTransactions(
    budgetUuid,
    month,
    dayOfMonth
  );
  const categories = await getCategoriesFromTransactions(
    budgetUuid,
    transactions
  );
  return (
    <TransactionContent
      budgetUuid={budgetUuid}
      categoryUuid={categoryUuid}
      month={month}
      categories={categories}
      transactions={transactions}
    />
  );
}
