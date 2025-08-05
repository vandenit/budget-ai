"use client";

import { useState } from 'react';
import { Category } from 'common-ts';
import { UnapprovedTransaction } from './UnapprovedTransactionsContent';
import { groupByDateGeneric, calculateTotalsGeneric } from '../../../components/transactions-page/utils';
import { TransactionCard, BaseTransaction } from '../../../components/transactions-page/transaction-card';
import { TransactionDateGroup } from '../../../components/transactions-page/transaction-date-group';
import { TransactionFilters, FilterType, SortType, unapprovedFilters, unapprovedSortOptions } from '../../../components/transactions-page/transaction-filters';
import { BadgeType } from '../../../components/transactions-page/transaction-badge';

interface Props {
    transactions: UnapprovedTransaction[];
    categories: Category[];
    approvingTransactions: Set<string>;
    onApproveSingle: (transactionId: string) => Promise<void>;
    onCategorizeAndApprove: (transactionId: string, categoryName: string) => Promise<void>;
}

// Create a compatible transaction type for the card component
interface UnapprovedTransactionForCard extends BaseTransaction {
    transaction_id: string;
    category_name?: string;
}

export default function UnapprovedTransactionsList({
    transactions,
    categories,
    approvingTransactions,
    onApproveSingle,
    onCategorizeAndApprove
}: Props) {
    const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [sortBy, setSortBy] = useState<SortType>('uncategorized_first');

    // Helper functions
    const getBadgeType = (transaction: UnapprovedTransaction): BadgeType => {
        if (transaction.category_name) return 'approved';
        return 'pending-approval';
    };

    const getVariant = (transaction: UnapprovedTransaction) => {
        if (!transaction.category_name) return 'attention';
        return 'success';
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
            case 'categorized':
                filtered = filtered.filter(tx => tx.category_name);
                break;
            case 'uncategorized':
                filtered = filtered.filter(tx => !tx.category_name);
                break;
            case 'all':
            default:
                break;
        }

        // Apply sorting
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

    // Event handlers
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

    const handleApprove = async (transactionId: string) => {
        await onApproveSingle(transactionId);
    };

    // Prepare data
    const filteredTransactions = getFilteredAndSortedTransactions();
    const groupedTransactions = groupByDateGeneric(filteredTransactions);

    // Convert transactions to format compatible with TransactionCard
    const convertToCardFormat = (transaction: UnapprovedTransaction): UnapprovedTransactionForCard => ({
        ...transaction,
        cleanPayeeName: transaction.clean_payee_name,
        memo: transaction.memo || `Transaction ID: ${transaction.transaction_id}`
    });

    // Count statistics for filter badges
    const categorizedCount = transactions.filter(tx => tx.category_name).length;
    const uncategorizedCount = transactions.filter(tx => !tx.category_name).length;

    // Prepare filter options with counts
    const getFilterCount = (filterValue: string) => {
        switch (filterValue) {
            case 'all': return transactions.length;
            case 'categorized': return categorizedCount;
            case 'uncategorized': return uncategorizedCount;
            default: return 0;
        }
    };

    const filterOptions = unapprovedFilters.map(option => ({
        ...option,
        count: getFilterCount(option.value)
    }));

    return (
        <div className="space-y-4">
            {/* Filters */}
            <TransactionFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Search by payee name..."
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                filterOptions={filterOptions}
                sortBy={sortBy}
                onSortChange={setSortBy}
                sortOptions={unapprovedSortOptions}
                totalCount={transactions.length}
                filteredCount={filteredTransactions.length}
            />

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
                Object.entries(groupedTransactions)
                    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                    .map(([date, dayTransactions]) => (
                        <TransactionDateGroup
                            key={date}
                            date={date}
                            transactions={dayTransactions}
                            defaultOpen={true}
                            showTotals={true}
                            showTransactionCount={true}
                            customTotals={calculateTotalsGeneric(dayTransactions)}
                        >
                            {dayTransactions.map((transaction) => {
                                const cardTransaction = convertToCardFormat(transaction);
                                const isApproving = approvingTransactions.has(transaction.transaction_id);
                                const isEditing = editingTransaction === transaction.transaction_id;

                                return (
                                    <div key={transaction.transaction_id}>
                                        <TransactionCard
                                            transaction={cardTransaction}
                                            categoryName={transaction.category_name || undefined}
                                            statusBadge={{
                                                type: getBadgeType(transaction)
                                            }}
                                            showCategory={true}
                                            showActions={true}
                                            showMemo={true}
                                            onEdit={() => handleCategoryEdit(transaction.transaction_id)}
                                            onApply={transaction.category_name ? () => handleApprove(transaction.transaction_id) : undefined}
                                            isApplying={isApproving}
                                            isEditing={isEditing}
                                            variant={getVariant(transaction)}
                                        />

                                        {/* Category editing dropdown */}
                                        {isEditing && (
                                            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">Select category to approve:</span>
                                                    <select
                                                        className="select select-bordered select-sm flex-1 max-w-xs"
                                                        defaultValue=""
                                                        onChange={(e) => {
                                                            if (e.target.value) {
                                                                handleCategorySave(transaction.transaction_id, e.target.value);
                                                            }
                                                        }}
                                                    >
                                                        <option value="" disabled>Choose category...</option>
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
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </TransactionDateGroup>
                    ))
            )}
        </div>
    );
}
