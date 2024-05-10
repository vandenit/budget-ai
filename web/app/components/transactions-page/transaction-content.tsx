"use client";
import { useState } from "react";
import { MonthlySpendingChart } from "../charts/mothly-spending-chart";
import { getMonthlySpendingData } from "../charts/util";
import CategorySelect from "./category-select";
import { CategoryPieChart } from "../charts/category-pie-chart";
import { Category } from "@/app/api/category/category.utils";
import {
  GroupedTransactions,
  Transaction,
} from "@/app/api/transaction/transaction.utils";
import { formatAmount } from "@/app/utils/amounts";
import { calculateTotals, formatDate, groupByDate } from "./utils";
import { FaArrowDown, FaArrowUp, FaChartBar, FaList } from "react-icons/fa";
import { TransactionList } from "./transaction-list";

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
  const [viewMode, setViewMode] = useState("list");
  const [newCategoryId, setNewCategoryId] = useState(categoryUuid);
  const usedCategoryId = newCategoryId || categoryUuid;

  const groupedTransactions = groupByDate(transactions);

  const toggleView = (mode: string) => {
    setViewMode(mode);
  };

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
        <div className="p-4">
          <h1 className="text-lg font-bold text-center mb-4 dark:text-white">
            Bank Transactions
          </h1>
          {!categoryUuid && (
            <div>
              <button onClick={() => toggleView("graph")} className="p-2">
                <FaChartBar title="Show Graph" />
              </button>
              <button onClick={() => toggleView("list")} className="p-2">
                <FaList title="Show List" />
              </button>
            </div>
          )}
        </div>
        {viewMode === "list" || categoryUuid ? (
          <TransactionList transactions={filteredTransactions} />
        ) : (
          <div className="m-5 w-3/4 text-center">
            <CategoryPieChart
              month={month || ""}
              categories={categories}
              selectedAmountTypes={["activity"]}
              budgetUuid={budgetUuid}
            />
          </div>
        )}
      </>
    </>
  );
};

export default TransactionContent;
