"use client";

import { useState } from 'react';
import { Category, formatAmount } from 'common-ts';
import { SuggestedTransaction } from './UncategorisedTransactionsContent';
import { formatDate, groupByDate, calculateTotals } from '../../../components/transactions-page/utils';
import { FaArrowDown, FaArrowUp, FaEdit, FaTrash, FaCheck } from 'react-icons/fa';

interface Props {
    transactions: SuggestedTransaction[];
    categories: Category[];
    onCategoryChange: (transactionId: string, newCategoryName: string) => void;
    onRemoveTransaction: (transactionId: string) => void;
}

interface GroupedSuggestedTransactions {
    [date: string]: SuggestedTransaction[];
}

export default function UncategorisedTransactionsList({
    transactions,
    categories,
    onCategoryChange,
    onRemoveTransaction
}: Props) {
    const [openDays, setOpenDays] = useState<{ [key: string]: boolean }>(() => {
        // Automatically open the first date
        const firstDate = transactions.length > 0 ? transactions[0].date : null;
        return firstDate ? { [firstDate]: true } : {};
    });
    const [editingTransaction, setEditingTransaction] = useState<string | null>(null);

    const toggleDay = (date: string) => {
        setOpenDays(prev => ({ ...prev, [date]: !prev[date] }));
    };

    const groupByDate = (transactions: SuggestedTransaction[]): GroupedSuggestedTransactions => {
        return transactions.reduce((groups: GroupedSuggestedTransactions, transaction: SuggestedTransaction) => {
            const date = transaction.date;
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(transaction);
            return groups;
        }, {});
    };

    const calculateTotalsForSuggested = (transactions: SuggestedTransaction[]) => {
        const income = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
        const outcome = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);
        return { income, outcome };
    };

    const handleCategoryEdit = (transactionId: string) => {
        setEditingTransaction(transactionId);
    };

    const handleCategorySave = (transactionId: string, newCategoryId: string) => {
        const selectedCategory = categories.find(c => c._id === newCategoryId);
        if (selectedCategory) {
            onCategoryChange(transactionId, selectedCategory.name);
        }
        setEditingTransaction(null);
    };

    const groupedTransactions = groupByDate(transactions);

    return (
        <div className="space-y-4">
            {Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
                <div key={date} className="card bg-base-100 shadow-lg">
                    <button
                        onClick={() => toggleDay(date)}
                        className="w-full text-left p-4 bg-gray-50 dark:bg-gray-800 rounded-t-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none flex justify-between items-center"
                        aria-expanded={openDays[date]}
                    >
                        <span className="font-semibold text-lg">{formatDate(date)}</span>
                        <span className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <FaArrowUp className="text-green-500" />
                                <span className="font-bold text-green-600">
                                    {formatAmount(calculateTotalsForSuggested(dayTransactions).income)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaArrowDown className="text-red-500" />
                                <span className="font-bold text-red-600">
                                    {formatAmount(Math.abs(calculateTotalsForSuggested(dayTransactions).outcome))}
                                </span>
                            </div>
                        </span>
                    </button>

                    {openDays[date] && (
                        <div className="p-4 space-y-3">
                            {dayTransactions.map((transaction) => (
                                <div
                                    key={transaction.transaction_id}
                                    className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 gap-4"
                                >
                                    <div className="flex-1">
                                        <div className="font-semibold text-lg dark:text-white">
                                            {transaction.payee_name}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Transaction ID: {transaction.transaction_id}
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                        {/* Category Selection */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">Category:</span>
                                            {editingTransaction === transaction.transaction_id ? (
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        className="select select-bordered select-sm w-full max-w-xs"
                                                        defaultValue={categories.find(c => c.name === transaction.suggested_category_name)?._id || ''}
                                                        onChange={(e) => {
                                                            if (e.target.value) {
                                                                handleCategorySave(transaction.transaction_id, e.target.value);
                                                            }
                                                        }}
                                                    >
                                                        <option value="">Select category</option>
                                                        {categories.map((category) => (
                                                            <option key={category._id} value={category._id}>
                                                                {category.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => setEditingTransaction(null)}
                                                        title="Cancel"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="badge badge-outline">
                                                        {transaction.suggested_category_name}
                                                    </span>
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => handleCategoryEdit(transaction.transaction_id)}
                                                        title="Edit category"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Amount */}
                                        <div className="text-right">
                                            <div
                                                className={`font-bold text-lg ${transaction.amount >= 0
                                                        ? "text-green-500 dark:text-green-200"
                                                        : "text-red-500 dark:text-red-300"
                                                    }`}
                                            >
                                                {formatAmount(transaction.amount)}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button
                                                className="btn btn-error btn-sm"
                                                onClick={() => onRemoveTransaction(transaction.transaction_id)}
                                                title="Remove from list"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
} 