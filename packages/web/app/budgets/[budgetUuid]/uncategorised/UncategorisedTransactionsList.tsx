"use client";

import { useState } from 'react';
import { Category, formatAmount } from 'common-ts';
import { SuggestedTransaction } from './UncategorisedTransactionsContent';
import { formatDate, groupByDate, calculateTotals } from '../../../components/transactions-page/utils';
import { FaArrowDown, FaArrowUp, FaEdit, FaTrash, FaCheck, FaRobot, FaPencilAlt, FaSearch, FaSort, FaExclamationTriangle } from 'react-icons/fa';

interface Props {
    transactions: SuggestedTransaction[];
    categories: Category[];
    manuallyModified: Set<string>;
    applyingTransactions: Set<string>;
    onCategoryChange: (transactionId: string, newCategoryName: string) => void;
    onRemoveTransaction: (transactionId: string) => void;
    onApplySingleCategory: (transactionId: string, categoryName: string) => Promise<void>;
}

interface GroupedSuggestedTransactions {
    [date: string]: SuggestedTransaction[];
}

type FilterType = 'all' | 'uncategorized' | 'manual_edit' | 'ai_suggestions';
type SortType = 'needs_attention_first' | 'amount_desc' | 'date_newest' | 'payee_name';

export default function UncategorisedTransactionsList({
    transactions,
    categories,
    manuallyModified,
    applyingTransactions,
    onCategoryChange,
    onRemoveTransaction,
    onApplySingleCategory
}: Props) {
    const [openDays, setOpenDays] = useState<{ [key: string]: boolean }>(() => {
        // Automatically open ALL dates by default for better UX
        const allDates = [...new Set(transactions.map(tx => tx.date))];
        const openState: { [key: string]: boolean } = {};
        allDates.forEach(date => {
            openState[date] = true;
        });
        return openState;
    });
    const [editingTransaction, setEditingTransaction] = useState<string | null>(null);

    // New state for filtering and searching
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [sortBy, setSortBy] = useState<SortType>('needs_attention_first');



    const toggleDay = (date: string) => {
        setOpenDays(prev => ({ ...prev, [date]: !prev[date] }));
    };

    // Filter and search logic
    const getFilteredAndSortedTransactions = () => {
        let filtered = transactions;

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(tx =>
                tx.payee_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply category filter
        switch (activeFilter) {
            case 'uncategorized':
                filtered = filtered.filter(tx => tx.suggested_category_name === 'Uncategorized');
                break;
            case 'manual_edit':
                filtered = filtered.filter(tx => manuallyModified.has(tx.transaction_id));
                break;
            case 'ai_suggestions':
                filtered = filtered.filter(tx => tx.suggested_category_name && tx.suggested_category_name !== 'Uncategorized' && !manuallyModified.has(tx.transaction_id));
                break;
            case 'all':
            default:
                // No additional filtering
                break;
        }

        // Apply sorting
        switch (sortBy) {
            case 'needs_attention_first':
                filtered.sort((a, b) => {
                    const aNeedsAttention = a.suggested_category_name === 'Uncategorized';
                    const bNeedsAttention = b.suggested_category_name === 'Uncategorized';
                    if (aNeedsAttention === bNeedsAttention) {
                        return new Date(b.date).getTime() - new Date(a.date).getTime();
                    }
                    return aNeedsAttention ? -1 : 1;
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

            // If we're in a filter that no longer applies to this transaction, switch to 'all'
            const transaction = transactions.find(t => t.transaction_id === transactionId);
            if (transaction && activeFilter !== 'all' && activeFilter !== 'manual_edit') {
                // Check if the new category would cause this transaction to not match the current filter
                if (activeFilter === 'uncategorized' && selectedCategory.name !== 'Uncategorized') {
                    console.log(`🔄 Switching from 'uncategorized' filter to 'all' because transaction no longer matches`);
                    setActiveFilter('all');
                } else if (activeFilter === 'ai_suggestions' && selectedCategory.name === 'Uncategorized') {
                    console.log(`🔄 Switching from 'ai_suggestions' filter to 'all' because transaction no longer matches`);
                    setActiveFilter('all');
                }
            }
        }
        setEditingTransaction(null);
    };

    const filteredTransactions = getFilteredAndSortedTransactions();
    const groupedTransactions = groupByDate(filteredTransactions);

    // Count statistics for filter badges
    const uncategorizedCount = transactions.filter(tx => tx.suggested_category_name === 'Uncategorized').length;
    const manualEditCount = manuallyModified.size;
    const aiSuggestionsCount = transactions.filter(tx => tx.suggested_category_name && tx.suggested_category_name !== 'Uncategorized' && !manuallyModified.has(tx.transaction_id)).length;

    return (
        <div className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search Bar */}
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

                        {/* Filter Buttons */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                className={`btn btn-sm ${activeFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => setActiveFilter('all')}
                            >
                                All ({transactions.length})
                            </button>
                            <button
                                className={`btn btn-sm gap-2 ${activeFilter === 'uncategorized' ? 'btn-warning' : 'btn-outline btn-warning'}`}
                                onClick={() => setActiveFilter('uncategorized')}
                                title="Show transactions suggested as 'Uncategorized'"
                            >
                                <FaExclamationTriangle className="w-3 h-3" />
                                Uncategorized ({uncategorizedCount})
                            </button>
                            <button
                                className={`btn btn-sm gap-2 ${activeFilter === 'manual_edit' ? 'btn-info' : 'btn-outline btn-info'}`}
                                onClick={() => setActiveFilter('manual_edit')}
                            >
                                <FaPencilAlt className="w-3 h-3" />
                                Manual ({manualEditCount})
                            </button>
                            <button
                                className={`btn btn-sm gap-2 ${activeFilter === 'ai_suggestions' ? 'btn-success' : 'btn-outline btn-success'}`}
                                onClick={() => setActiveFilter('ai_suggestions')}
                            >
                                <FaRobot className="w-3 h-3" />
                                AI suggestions ({aiSuggestionsCount})
                            </button>
                        </div>

                        {/* Sort Dropdown */}
                        <div className="dropdown dropdown-end">
                            <div tabIndex={0} role="button" className="btn btn-outline btn-sm gap-2">
                                <FaSort />
                                Sort
                            </div>
                            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-64">
                                <li>
                                    <button
                                        className={sortBy === 'needs_attention_first' ? 'active' : ''}
                                        onClick={() => setSortBy('needs_attention_first')}
                                    >
                                        🚨 Needs attention first
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className={sortBy === 'amount_desc' ? 'active' : ''}
                                        onClick={() => setSortBy('amount_desc')}
                                    >
                                        💰 Amount (high → low)
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className={sortBy === 'date_newest' ? 'active' : ''}
                                        onClick={() => setSortBy('date_newest')}
                                    >
                                        📅 Date (newest → oldest)
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className={sortBy === 'payee_name' ? 'active' : ''}
                                        onClick={() => setSortBy('payee_name')}
                                    >
                                        🏪 Payee (A-Z)
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Active filters info */}
                    {(searchTerm || activeFilter !== 'all') && (
                        <div className="mt-3 flex flex-wrap gap-2 items-center">
                            <span className="text-sm text-gray-600">Active filters:</span>
                            {searchTerm && (
                                <div className="badge badge-neutral gap-2">
                                    <FaSearch className="w-3 h-3" />
                                    "{searchTerm}"
                                    <button
                                        className="ml-1 text-xs"
                                        onClick={() => setSearchTerm('')}
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                            {activeFilter !== 'all' && (
                                <div className="badge badge-primary gap-2">
                                    {activeFilter === 'uncategorized' && 'Uncategorized'}
                                    {activeFilter === 'manual_edit' && 'Manual edits'}
                                    {activeFilter === 'ai_suggestions' && 'AI suggestions'}
                                    <button
                                        className="ml-1 text-xs"
                                        onClick={() => setActiveFilter('all')}
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                            <span className="text-sm text-gray-500">
                                ({filteredTransactions.length} of {transactions.length} transactions)
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Results */}
            {filteredTransactions.length === 0 ? (
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body text-center py-12">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-bold mb-2">No results found</h3>
                        <p className="text-gray-600">
                            {searchTerm || activeFilter !== 'all'
                                ? 'Try adjusting your search or filters.'
                                : 'No transactions available.'
                            }
                        </p>
                        {(searchTerm || activeFilter !== 'all') && (
                            <button
                                className="btn btn-outline btn-sm mt-4"
                                onClick={() => {
                                    setSearchTerm('');
                                    setActiveFilter('all');
                                }}
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
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
                                {dayTransactions.map((transaction) => {
                                    const isManuallyModified = manuallyModified.has(transaction.transaction_id);
                                    const isLoading = transaction.loading_suggestion || false;
                                    const isCached = transaction.cached || false;
                                    const isApplying = applyingTransactions.has(transaction.transaction_id);
                                    const isUncategorized = transaction.suggested_category_name === 'Uncategorized';
                                    const needsAttention = isUncategorized;

                                    return (
                                        <div
                                            key={transaction.transaction_id}
                                            className={`flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded-lg border gap-4 ${needsAttention
                                                ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800 border-l-4 border-l-red-500'
                                                : isManuallyModified
                                                    ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800'
                                                    : 'bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-700'
                                                }`}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-semibold text-lg dark:text-white">
                                                        {transaction.payee_name}
                                                    </div>
                                                    {isManuallyModified ? (
                                                        <span className="badge badge-warning text-orange-900 font-medium gap-1">
                                                            <FaPencilAlt className="w-3 h-3" />
                                                            Manual Edit
                                                        </span>
                                                    ) : isLoading ? (
                                                        <span className="badge badge-ghost gap-1">
                                                            <span className="loading loading-spinner loading-xs"></span>
                                                            Loading AI...
                                                        </span>
                                                    ) : isCached ? (
                                                        <span className="badge badge-success text-green-900 font-medium gap-1">
                                                            <FaRobot className="w-3 h-3" />
                                                            AI (Cached)
                                                        </span>
                                                            ) : transaction.suggested_category_name === 'Uncategorized' ? (
                                                                <span className="badge badge-warning text-orange-900 font-medium gap-1">
                                                                    <FaRobot className="w-3 h-3" />
                                                                    AI (Uncategorized)
                                                                </span>
                                                                ) : transaction.suggested_category_name ? (
                                                                    <span className="badge badge-primary text-blue-900 font-medium gap-1">
                                                                        <FaRobot className="w-3 h-3" />
                                                                        AI (Generated)
                                                                    </span>
                                                                ) : (
                                                        <span className="badge badge-error text-red-900 font-medium gap-1">
                                                            <FaExclamationTriangle className="w-3 h-3" />
                                                            <span>No Suggestion</span>
                                                        </span>
                                                    )}
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
                                                    ) : isLoading ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="loading loading-dots loading-sm"></span>
                                                            <span className="text-sm text-gray-500">Loading suggestion...</span>
                                                        </div>
                                                    ) : transaction.suggested_category_name ? (
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`badge ${isManuallyModified
                                                                        ? 'badge-warning text-orange-900'
                                                                        : isUncategorized
                                                                            ? 'badge-error text-red-900'
                                                                    : isCached
                                                                        ? 'badge-success text-green-900'
                                                                        : 'badge-primary text-blue-900'
                                                                        } font-medium px-3 py-1`}>
                                                                {transaction.suggested_category_name}
                                                            </span>
                                                            <button
                                                                className="btn btn-ghost btn-sm"
                                                                onClick={() => handleCategoryEdit(transaction.transaction_id)}
                                                                title="Edit category"
                                                            >
                                                                <FaEdit />
                                                            </button>
                                                                    {transaction.suggested_category_name && (
                                                                        <button
                                                                            className="btn btn-success btn-sm gap-1"
                                                                            onClick={() => onApplySingleCategory(transaction.transaction_id, transaction.suggested_category_name!)}
                                                                            title="Apply this category to YNAB"
                                                                            disabled={isApplying}
                                                                        >
                                                                            {isApplying ? (
                                                                                <>
                                                                                    <span className="loading loading-spinner loading-xs"></span>
                                                                                    Applying...
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <FaCheck className="w-3 h-3" />
                                                                                    Apply
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="badge badge-outline badge-ghost">
                                                                No suggestion
                                                            </span>
                                                            <button
                                                                className="btn btn-ghost btn-sm"
                                                                onClick={() => handleCategoryEdit(transaction.transaction_id)}
                                                                title="Set category manually"
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
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
} 