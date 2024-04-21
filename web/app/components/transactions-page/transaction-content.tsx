"use client";
import { useState } from "react";
import { MonthlySpendingChart } from "../charts/mothly-spending-chart";
import { getMonthlySpendingData } from "../charts/util";
import CategorySelect from "./category-select";
import { CategoryPieChart } from "../charts/category-pie-chart";
import { Category } from "@/app/api/category/category.utils";
import { Transaction } from "@/app/api/transaction/transaction.utils";
import { formatAmount } from "@/app/utils/amounts";

const TransactionContent = ({
  budgetUuid,
  categoryUuid,
  categories,
  transactions,
  month,
}: {
  budgetUuid: string;
  categoryUuid?: string;
  month?: string;
  categories: Category[];
  transactions: Transaction[];
}) => {
  const [newCategoryId, setNewCategoryId] = useState(categoryUuid);
  const usedCategoryId = newCategoryId || categoryUuid;

  const categoryFilter = (transaction: Transaction) =>
    usedCategoryId === undefined || transaction.categoryId === usedCategoryId;

  const filteredTransactions = transactions.filter(categoryFilter);

  return (
    <>
      <h1 className="m-2">Transactions {month}</h1>
      <CategorySelect
        categoryUuid={usedCategoryId}
        categories={categories}
        onChange={setNewCategoryId}
      />
      <>
        {!categoryUuid && (
          <div className="m-5 w-3/4 text-center">
            <CategoryPieChart
              month={month || ""}
              categories={categories}
              selectedAmountTypes={["activity"]}
              budgetUuid={budgetUuid}
            />
          </div>
        )}

        <MonthlySpendingChart
          spendingData={getMonthlySpendingData(filteredTransactions)}
          categoryUuid={categoryUuid || ""}
          month={month || ""}
          budgetUuid={budgetUuid}
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
              <tr key={transaction.uuid}>
                <td>{transaction.date}</td>

                <td>{formatAmount(transaction.amount)}</td>
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
