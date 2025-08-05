"use client";

import { useState } from 'react';
import { Category } from 'common-ts';
import { SuggestedTransaction } from './UncategorisedTransactionsContent';
import { groupByDateGeneric, calculateTotalsGeneric } from '../../../components/transactions-page/utils';
import { TransactionCard, BaseTransaction } from '../../../components/transactions-page/transaction-card';
import { TransactionDateGroup } from '../../../components/transactions-page/transaction-date-group';
import { TransactionFilters, FilterType, SortType, uncategorizedFilters, uncategorizedSortOptions } from '../../../components/transactions-page/transaction-filters';
import { BadgeType } from '../../../components/transactions-page/transaction-badge';

interface Props {
    transactions: SuggestedTransaction[];
    categories: Category[];
    manuallyModified: Set<string>;
    applyingTransactions: Set<string>;
    onCategoryChange: (transactionId: string, newCategoryName: string) => void;
    onRemoveTransaction: (transactionId: string) => void;
    onApplySingleCategory: (transactionId: string, categoryName: string) => Promise<void>;
    onApplyManualCategory: (transactionId: string, categoryName: string) => Promise<void>;
}

// Create a compatible transaction type for the card component
interface SuggestedTransactionForCard extends BaseTransaction {
    transaction_id: string;
    suggested_category_name?: string | null;
    loading_suggestion?: boolean;
    cached?: boolean;
}

export default function UncategorisedTransactionsList({
    transactions,
    categories,
    manuallyModified,
    applyingTransactions,
    onCategoryChange,
    onRemoveTransaction,
    onApplySingleCategory,
    onApplyManualCategory
}: Props) {
    const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [sortBy, setSortBy] = useState<SortType>('needs_attention_first');

    // Helper functions
    const getBadgeType = (transaction: SuggestedTransaction): BadgeType => {
        const isManuallyModified = manuallyModified.has(transaction.transaction_id);
        const isLoading = transaction.loading_suggestion || false;
        const isCached = transaction.cached || false;
        const isUncategorized = transaction.suggested_category_name === 'Uncategorized';

        if (isManuallyModified) return 'manual-edit';
        if (isLoading) return 'loading';
        if (isCached) return 'ai-cached';
        if (isUncategorized) return 'ai-uncategorized';
        if (transaction.suggested_category_name) return 'ai-generated';
        return 'no-suggestion';
    };

    const getVariant = (transaction: SuggestedTransaction) => {
        const isManuallyModified = manuallyModified.has(transaction.transaction_id);
        const isUncategorized = transaction.suggested_category_name === 'Uncategorized';

        if (isUncategorized) return 'attention';
        if (isManuallyModified) return 'modified';
        return 'default';
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
                filtered = filtered.filter(tx =>
                    tx.suggested_category_name &&
                    tx.suggested_category_name !== 'Uncategorized' &&
                    !manuallyModified.has(tx.transaction_id)
                );
                break;
            case 'all':
            default:
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

    // Event handlers
    const handleCategoryEdit = (transactionId: string) => {
        setEditingTransaction(transactionId);
    };

    const handleCategorySave = async (transactionId: string, newCategoryId: string) => {
        const selectedCategory = categories.find(c => c._id === newCategoryId);
        if (selectedCategory) {
            onCategoryChange(transactionId, selectedCategory.name);

            // Auto-switch filters if needed
            const transaction = transactions.find(t => t.transaction_id === transactionId);
            if (transaction && activeFilter !== 'all' && activeFilter !== 'manual_edit') {
                const shouldSwitchToAll =
                    (activeFilter === 'uncategorized' && selectedCategory.name !== 'Uncategorized') ||
                    (activeFilter === 'ai_suggestions' && selectedCategory.name === 'Uncategorized');

                if (shouldSwitchToAll) {
                    setActiveFilter('all');
                }
            }
        }
        setEditingTransaction(null);
    };

    const handleApplyClick = async (transactionId: string, categoryName: string) => {
        const isManuallyModified = manuallyModified.has(transactionId);

        if (isManuallyModified) {
            await onApplyManualCategory(transactionId, categoryName);
        } else {
            await onApplySingleCategory(transactionId, categoryName);
        }
    };

    // Prepare data
    const filteredTransactions = getFilteredAndSortedTransactions();
    const groupedTransactions = groupByDateGeneric(filteredTransactions);

    // Convert transactions to format compatible with TransactionCard
    const convertToCardFormat = (transaction: SuggestedTransaction): SuggestedTransactionForCard => ({
        ...transaction,
        cleanPayeeName: transaction.clean_payee_name,
        memo: transaction.memo || `Transaction ID: ${transaction.transaction_id}`
    });

    // Count statistics for filter badges
    const uncategorizedCount = transactions.filter(tx => tx.suggested_category_name === 'Uncategorized').length;
    const manualEditCount = manuallyModified.size;
    const aiSuggestionsCount = transactions.filter(tx =>
        tx.suggested_category_name &&
        tx.suggested_category_name !== 'Uncategorized' &&
        !manuallyModified.has(tx.transaction_id)
    ).length;

    // Prepare filter options with counts
    const getFilterCount = (filterValue: string) => {
        switch (filterValue) {
            case 'all': return transactions.length;
            case 'uncategorized': return uncategorizedCount;
            case 'manual_edit': return manualEditCount;
            case 'ai_suggestions': return aiSuggestionsCount;
            default: return 0;
        }
    };

    const filterOptions = uncategorizedFilters.map(option => ({
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
                sortOptions={uncategorizedSortOptions}
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
                Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
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
                            const isApplying = applyingTransactions.has(transaction.transaction_id);
                            const isEditing = editingTransaction === transaction.transaction_id;

                            return (
                                <div key={transaction.transaction_id}>
                                    <TransactionCard
                                        transaction={cardTransaction}
                                        categoryName={transaction.suggested_category_name || undefined}
                                        categoryBadgeProps={{
                                            isManuallyModified: manuallyModified.has(transaction.transaction_id),
                                            isUncategorized: transaction.suggested_category_name === 'Uncategorized',
                                            isCached: transaction.cached || false
                                        }}
                                        statusBadge={{
                                            type: getBadgeType(transaction)
                                        }}
                                        showCategory={true}
                                        showActions={true}
                                        showMemo={true}
                                        onEdit={() => handleCategoryEdit(transaction.transaction_id)}
                                        onRemove={() => onRemoveTransaction(transaction.transaction_id)}
                                        onApply={() => handleApplyClick(transaction.transaction_id, transaction.suggested_category_name!)}
                                        isApplying={isApplying}
                                        isEditing={isEditing}
                                        variant={getVariant(transaction)}
                                    />

                                    {/* Category editing dropdown */}
                                    {isEditing && (
                                        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">Select category:</span>
                                                <select
                                                    className="select select-bordered select-sm flex-1 max-w-xs"
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
