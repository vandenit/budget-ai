import { calculateTotals, formatDate, groupByDate } from "./utils";
import { useState } from "react";
import { Category, formatAmount, Transaction } from "common-ts";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import { get } from "http";

export const TransactionList = ({
  transactions,
  categories
}: {
  transactions: Transaction[];
  categories: Category[];
}) => {
  const [openDays, setOpenDays] = useState<{ [key: string]: boolean }>(() => {
    // Automatically open the first date
    const firstDate = transactions.length > 0 ? transactions[0].date : null;
    return firstDate ? { [firstDate]: true } : {};
  });

  const toggleDay = (date: string) => {
    setOpenDays((prev) => ({ ...prev, [date]: !prev[date] }));
  };
  const getCategoryName = (categoryId: string | undefined | null, categories: Category[]) => {
    const category = categories.find((category) => category._id === categoryId);
    return category ? category.name : "Uncategorized";
  }

  const groupedTransactions = groupByDate(transactions);
  return Object.entries(groupedTransactions).map(([date, transactions]) => (
    <div key={date} className="mb-4">
      <button
        onClick={() => toggleDay(date)}
        className="w-full text-left text-md font-semibold py-2 px-4 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none flex justify-between items-center"
        aria-expanded={openDays[date]}
        aria-controls={`transactions-${date}`}
      >
        <span>{formatDate(date)}</span>
        <span className="flex items-center">
          <FaArrowUp className="text-green-500 mr-2" />
          <span className="font-bold mr-4">
            {formatAmount(calculateTotals(transactions).income)}
          </span>
          <FaArrowDown className="text-red-500 mr-2" />
          <span className="font-bold">
            {formatAmount(calculateTotals(transactions).outcome, true)}
          </span>
        </span>
      </button>
      {openDays[date] && (
        <ul id={`transactions-${date}`} className="mt-2 space-y-2">
          {transactions.map((transaction) => (
            <li
              key={transaction.uuid}
              className="p-4 rounded-lg shadow bg-white dark:bg-gray-900 flex flex-col md:flex-row justify-between"
            >
              <div>
                <div className="font-semibold dark:text-white">
                  {transaction.payeeName}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {getCategoryName(transaction.categoryId, categories)}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`font-bold text-lg ${transaction.amount >= 0 ? "text-green-500" : "text-red-500"
                    } dark:text-green-200 dark:text-red-300`}
                >
                  {formatAmount(transaction.amount)}
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-sm">
                  {transaction.memo}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  ));
};
