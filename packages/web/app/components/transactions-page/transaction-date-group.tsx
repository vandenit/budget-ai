import React, { useState } from 'react';
import { formatAmount } from 'common-ts';
import { formatDate, calculateTotalsGeneric } from './utils';
import { FaArrowDown, FaArrowUp, FaChevronDown, FaChevronRight } from 'react-icons/fa';

interface TransactionDateGroupProps<T extends { date: string; amount: number }> {
  date: string;
  transactions: T[];
  children: React.ReactNode;

  // Display options
  showTotals?: boolean;
  showTransactionCount?: boolean;
  defaultOpen?: boolean;

  // Styling
  className?: string;
  headerClassName?: string;
  contentClassName?: string;

  // Custom totals calculation (if transactions have different structure)
  customTotals?: {
    income: number;
    outcome: number;
  };
}

export function TransactionDateGroup<T extends { date: string; amount: number }>({
  date,
  transactions,
  children,
  showTotals = true,
  showTransactionCount = true,
  defaultOpen = false,
  className = '',
  headerClassName = '',
  contentClassName = '',
  customTotals
}: TransactionDateGroupProps<T>) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleOpen = () => setIsOpen(!isOpen);

  // Calculate totals
  const totals = customTotals || calculateTotalsGeneric(transactions);

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
      {/* Header */}
      <button
        onClick={toggleOpen}
        className={`w-full text-left p-5 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 hover:from-slate-100 hover:to-gray-100 dark:hover:from-slate-700 dark:hover:to-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset flex justify-between items-center transition-all duration-200 ${headerClassName}`}
        aria-expanded={isOpen}
        aria-controls={`transactions-${date}`}
      >
        {/* Left side - Date and count */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isOpen ? (
              <FaChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <FaChevronRight className="w-4 h-4 text-gray-500" />
            )}
            <span className="font-semibold text-lg">{formatDate(date)}</span>
          </div>

          {showTransactionCount && (
            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Right side - Totals */}
        {showTotals && (
          <div className="flex items-center gap-4">
            {/* Income */}
            {totals.income > 0 && (
              <div className="flex items-center gap-2">
                <FaArrowUp className="text-green-500 w-4 h-4" />
                <span className="font-bold text-green-600">
                  {formatAmount(totals.income)}
                </span>
              </div>
            )}

            {/* Outcome */}
            {totals.outcome < 0 && (
              <div className="flex items-center gap-2">
                <FaArrowDown className="text-red-500 w-4 h-4" />
                <span className="font-bold text-red-600">
                  {formatAmount(Math.abs(totals.outcome))}
                </span>
              </div>
            )}

            {/* Net total if both income and outcome exist */}
            {totals.income > 0 && totals.outcome < 0 && (
              <div className="hidden sm:flex items-center gap-2 border-l pl-4 ml-2">
                <span className="text-sm text-gray-500">Net:</span>
                <span className={`font-bold ${(totals.income + totals.outcome) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatAmount(totals.income + totals.outcome)}
                </span>
              </div>
            )}
          </div>
        )}
      </button>

      {/* Content */}
      {isOpen && (
        <div
          id={`transactions-${date}`}
          className={`p-5 space-y-3 bg-white dark:bg-slate-900 ${contentClassName}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// Simplified version for basic transaction lists
interface SimpleTransactionDateGroupProps {
  date: string;
  transactionCount: number;
  income: number;
  outcome: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function SimpleTransactionDateGroup({
  date,
  transactionCount,
  income,
  outcome,
  children,
  defaultOpen = false,
  className = ''
}: SimpleTransactionDateGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`mb-4 ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left text-md font-semibold py-2 px-4 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none flex justify-between items-center"
        aria-expanded={isOpen}
        aria-controls={`simple-transactions-${date}`}
      >
        <span>{formatDate(date)}</span>
        <span className="flex items-center">
          <FaArrowUp className="text-green-500 mr-2" />
          <span className="font-bold mr-4">
            {formatAmount(income)}
          </span>
          <FaArrowDown className="text-red-500 mr-2" />
          <span className="font-bold">
            {formatAmount(Math.abs(outcome))}
          </span>
        </span>
      </button>

      {isOpen && (
        <div id={`simple-transactions-${date}`} className="mt-2 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}
