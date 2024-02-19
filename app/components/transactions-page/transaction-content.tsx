"use client";
import { useState } from "react";
import { MonthlySpendingChart } from "../charts/mothly-spending-chart";
import { getMonthlySpendingData } from "../charts/util";
import CategorySelect from "./category-select";
import { Category } from "@/app/api/budget.server";
import { formatYnabAmount } from "@/app/utils/ynab";
import { Transaction } from "@/app/api/transaction/transaction.server";

const TransactionContent = ({
  budgetId,
  categoryId,
  categories,
  transactions,
  month,
}: {
  budgetId: string;
  categoryId?: string;
  month?: string;
  categories: Category[];
  transactions: Transaction[];
}) => {
  const [newCategoryId, setNewCategoryId] = useState(categoryId);
  const usedCategoryId = newCategoryId || categoryId;

  const categoryFilter = (transaction: Transaction) =>
    usedCategoryId === undefined || transaction.categoryId === usedCategoryId;

  const filteredTransactions = transactions.filter(categoryFilter);

  return (
    <>
      <h1>Transactions</h1>
      <CategorySelect
        categoryId={usedCategoryId}
        categories={categories}
        onChange={setNewCategoryId}
      />
      <>
        <MonthlySpendingChart
          spendingData={getMonthlySpendingData(filteredTransactions)}
          categoryId={categoryId || ""}
          month={month || ""}
          budgetId={budgetId}
        />
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Payee</th>
              <th>Memo</th>
              <th>Category Name</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{transaction.date}</td>

                <td>{formatYnabAmount(transaction.amount)}</td>
                <td>{transaction.payeeName}</td>
                <td>{transaction.memo}</td>
                <td>{transaction.categoryName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    </>
  );
};

export default TransactionContent;
