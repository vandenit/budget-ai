"use client";

import { useState } from 'react';
import { Category, formatAmount } from 'common-ts';
import { UnapprovedTransaction } from './UnapprovedTransactionsContent';
import { formatDate } from '../../../components/transactions-page/utils';
import { FaCheck, FaEdit, FaSearch, FaSort, FaClock } from 'react-icons/fa';

interface Props {
    transactions: UnapprovedTransaction[];
    categories: Category[];
    approvingTransactions: Set<string>;
    onApproveSingle: (transactionId: string) => Promise<void>;
    onCategorizeAndApprove: (transactionId: string, categoryName: string) => Promise<void>;
}

interface GroupedUnapprovedTransactions {
    [date: string]: UnapprovedTransaction[];
}

type FilterType = 'all' | 'categorized' | 'uncategorized';
type SortType = 'uncategorized_first' | 'amount_desc' | 'date_newest' | 'payee_name';

export default function UnapprovedTransactionsList({
    transactions,
    categories,
    approvingTransactions,
    onApproveSingle,
    onCategorizeAndApprove
}: Props) {
    const [openDays, setOpenDays] = useState<{ [key: string]: boolean }>(() => {
        const allDates = [...new Set(transactions.map(tx => tx.date))];
        const openState: { [key: string]: boolean } = {};
        allDates.forEach(date => {
            openState[date] = true;
        });
        return openState;
    });

    const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [sortBy, setSortBy] = useState<SortType>('uncategorized_first');

    const toggleDay = (date: string) => {
        setOpenDays(prev => ({ ...prev, [date]: !prev[date] }));
    };

    const getFilteredAndSortedTransactions = () => {
        let filtered = transactions;

        if (searchTerm) {
            filtered = filtered.filter(tx =>
                tx.payee_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        switch (activeFilter) {
            case 'categorized':
                filtered = filtered.filter(tx => tx.category_name);
                break;
            case 'uncategorized':
                filtered = filtered.filter(tx => !tx.category_name);
                break;
        }

        switch (sortBy) {
            case 'uncategorized_first':
                filtered.sort((a, b) => {
                    const aUncategorized = !a.category_name;
                    const bUncategorized = !b.category_name;
                    if (aUncategorized === bUncategorized) {
                        return new Date(b.date).getTime() - new Date(a.date).getTime();
                    }
                    return aUncategorized ? -1 : 1;
                });
                break;
            case 'amount_desc':
                filtered.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
                break;
            case 'date_newest':
                filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                break;
            case 'payee_name':
                filtered.sort((a, b) => a.payee_name.localeCompare(b.payee_name));
                break;
        }

        return filtered;
    };

    const groupByDate = (transactions: UnapprovedTransaction[]): GroupedUnapprovedTransactions => {
        return transactions.reduce((groups: GroupedUnapprovedTransactions, transaction: UnapprovedTransaction) => {
            const date = transaction.date;
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(transaction);
            return groups;
        }, {});
    };

    const handleCategoryEdit = (transactionId: string) => {
        setEditingTransaction(transactionId);
    };

    const handleCategorySave = async (transactionId: string, newCategoryId: string) => {
        const selectedCategory = categories.find(c => c._id === newCategoryId);
        if (selectedCategory) {
            await onCategorizeAndApprove(transactionId, selectedCategory.name);
        }
        setEditingTransaction(null);
    };

    const filteredTransactions = getFilteredAndSortedTransactions();
    const groupedTransactions = groupByDate(filteredTransactions);

    const categorizedCount = transactions.filter(tx => tx.category_name).length;
    const uncategorizedCount = transactions.filter(tx => !tx.category_name).length;

    return (
        <div className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by payee name..."
                                    className="input input-bordered w-full pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                className={`btn btn-sm ${activeFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => setActiveFilter('all')}
                            >
                                All ({transactions.length})
                            </button>
                            <button
                                className={`btn btn-sm gap-2 ${activeFilter === 'categorized' ? 'btn-success' : 'btn-outline btn-success'}`}
                                onClick={() => setActiveFilter('categorized')}
                            >
                                <FaCheck className="w-3 h-3" />
                                Categorized ({categorizedCount})
                            </button>
                            <button
                                className={`btn btn-sm gap-2 ${activeFilter === 'uncategorized' ? 'btn-warning' : 'btn-outline btn-warning'}`}
                                onClick={() => setActiveFilter('uncategorized')}
                            >
                                <FaClock className="w-3 h-3" />
                                Uncategorized ({uncategorizedCount})
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions by Date */}
            {Object.keys(groupedTransactions).length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">No transactions match your current filters.</p>
                </div>
            ) : (
                Object.entries(groupedTransactions)
                    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                    .map(([date, dayTransactions]) => (
                        <div key={date} className="card bg-base-100 shadow-md">
                            <div
                                className="card-header cursor-pointer"
                                onClick={() => toggleDay(date)}
                            >
                                <div className="flex justify-between items-center p-4">
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold text-lg">
                                            {formatDate(date)}
                                        </span>
                                        <div className="badge badge-neutral">
                                            {dayTransactions.length} transaction{dayTransactions.length !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">
                                            {formatAmount(dayTransactions.reduce((sum, tx) => sum + tx.amount, 0))}
                                        </span>
                                        <span className={`transform transition-transform ${openDays[date] ? 'rotate-180' : ''}`}>
                                            ▼
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {openDays[date] && (
                                <div className="card-body pt-0">
                                    <div className="space-y-2">
                                        {dayTransactions.map((transaction) => (
                                            <div
                                                key={transaction.transaction_id}
                                                className="flex flex-col md:flex-row items-start md:items-center justify-between p-3 border border-base-300 rounded-lg hover:bg-base-50 transition-colors"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium truncate">
                                                            {transaction.payee_name}
                                                        </span>
                                                        {!transaction.category_name && (
                                                            <div className="badge badge-warning badge-sm">
                                                                Uncategorized
                                                            </div>
                                                        )}
                                                    </div>
                                                    {transaction.category_name && (
                                                        <div className="text-sm text-gray-600">
                                                            Category: {transaction.category_name}
                                                        </div>
                                                    )}
                                                    {transaction.memo && (
                                                        <div className="text-sm text-gray-500 truncate">
                                                            {transaction.memo}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3 mt-2 md:mt-0">
                                                    <span className={`font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {formatAmount(transaction.amount)}
                                                    </span>

                                                    <div className="flex gap-2">
                                                        {editingTransaction === transaction.transaction_id ? (
                                                            <select
                                                                className="select select-sm select-bordered"
                                                                onChange={(e) => handleCategorySave(transaction.transaction_id, e.target.value)}
                                                                defaultValue=""
                                                            >
                                                                <option value="" disabled>Choose category...</option>
                                                                {categories.map((category) => (
                                                                    <option key={category._id} value={category._id}>
                                                                        {category.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <button
                                                                className="btn btn-sm btn-outline btn-info gap-1"
                                                                onClick={() => handleCategoryEdit(transaction.transaction_id)}
                                                                disabled={approvingTransactions.has(transaction.transaction_id)}
                                                            >
                                                                <FaEdit className="w-3 h-3" />
                                                                Edit & Approve
                                                            </button>
                                                        )}

                                                        {transaction.category_name && (
                                                            <button
                                                                className="btn btn-sm btn-success gap-1"
                                                                onClick={() => onApproveSingle(transaction.transaction_id)}
                                                                disabled={approvingTransactions.has(transaction.transaction_id)}
                                                            >
                                                                {approvingTransactions.has(transaction.transaction_id) ? (
                                                                    <span className="loading loading-spinner loading-xs"></span>
                                                                ) : (
                                                                    <FaCheck className="w-3 h-3" />
                                                                )}
                                                                Approve
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
            )}
        </div>
    );
} 