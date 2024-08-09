"use client";
import { useState } from "react";
import CategorySelect from "./category-select";
import { CategoryPieChart } from "../charts/category-pie-chart";
import {
  GroupedTransactions,
  Category,
  formatAmount,
  Transaction,

} from "common-ts";
import { calculateTotals, formatDate, groupByDate } from "./utils";
import { FaArrowDown, FaArrowUp, FaChartBar, FaList } from "react-icons/fa";
import { TransactionList } from "./transaction-list";
import { TransactionTotals } from "./transaction-totals";

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
  const [newCategoryUuid, setNewCategoryUuid] = useState(categoryUuid);
  const usedCategoryUuid = newCategoryUuid || categoryUuid;

  const groupedTransactions = groupByDate(transactions);

  const toggleView = (mode: string) => {
    setViewMode(mode);
  };

  const usedCategoryId = categories.find(
    (category) => category.uuid === usedCategoryUuid
  )?._id;

  const categoryFilter = (transaction: Transaction) =>
    usedCategoryId === undefined || transaction.categoryId === usedCategoryId;

  const filteredTransactions = transactions.filter(categoryFilter);

  return (
    <>
      <h1 className="m-2">Transactions {month}</h1>
      <CategorySelect
        categoryUuid={usedCategoryUuid}
        categories={categories}
        onChange={setNewCategoryUuid}
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
          <TransactionTotals transactions={filteredTransactions} />
        </div>
        {viewMode === "list" || categoryUuid ? (
          <TransactionList transactions={filteredTransactions} categories={categories} />
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
