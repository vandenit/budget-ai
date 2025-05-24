"use client";

import { useState } from 'react';
import { Category } from 'common-ts';
import { applyCategories } from './actions';
import UncategorisedTransactionsList from './UncategorisedTransactionsList';
import UncategorisedStats from './UncategorisedStats';

export interface SuggestedTransaction {
    transaction_id: string;
    payee_name: string;
    amount: number;
    date: string;
    suggested_category_name: string;
}

interface Props {
    budgetUuid: string;
    categories: Category[];
    initialSuggestedTransactions: SuggestedTransaction[];
}

export default function UncategorisedTransactionsContent({
    budgetUuid,
    categories,
    initialSuggestedTransactions
}: Props) {
    const [suggestedTransactions, setSuggestedTransactions] = useState<SuggestedTransaction[]>(initialSuggestedTransactions);
    const [isApplying, setIsApplying] = useState(false);
    const [lastApplyResult, setLastApplyResult] = useState<any>(null);

    const handleApplyAllSuggestions = async () => {
        setIsApplying(true);
        try {
            const result = await applyCategories(budgetUuid);
            setLastApplyResult(result);

            // Show success message and refresh data
            if (result.length > 0) {
                // Remove applied transactions from the list
                const appliedTransactionIds = result.map((r: any) => r.transaction_id);
                setSuggestedTransactions(prev =>
                    prev.filter(t => !appliedTransactionIds.includes(t.transaction_id))
                );
            }
        } catch (error) {
            console.error('Error applying suggestions:', error);
            setLastApplyResult({ error: 'Failed to apply suggestions' });
        } finally {
            setIsApplying(false);
        }
    };

    const handleManualCategoryChange = (transactionId: string, newCategoryName: string) => {
        setSuggestedTransactions(prev =>
            prev.map(transaction =>
                transaction.transaction_id === transactionId
                    ? { ...transaction, suggested_category_name: newCategoryName }
                    : transaction
            )
        );
    };

    const handleRemoveTransaction = (transactionId: string) => {
        setSuggestedTransactions(prev =>
            prev.filter(t => t.transaction_id !== transactionId)
        );
    };

    return (
        <div className="space-y-6">
            {/* Stats and Actions */}
            <UncategorisedStats
                totalTransactions={suggestedTransactions.length}
                onApplyAll={handleApplyAllSuggestions}
                isApplying={isApplying}
                lastResult={lastApplyResult}
            />

            {/* Results Alert */}
            {lastApplyResult && (
                <div className={`alert ${lastApplyResult.error ? 'alert-error' : 'alert-success'}`}>
                    <span>
                        {lastApplyResult.error
                            ? lastApplyResult.error
                            : `Successfully applied ${lastApplyResult.length} suggestions!`
                        }
                    </span>
                </div>
            )}

            {/* Transactions List */}
            {suggestedTransactions.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold mb-2">All transactions are categorised!</h2>
                    <p className="text-gray-600">No uncategorised transactions found.</p>
                </div>
            ) : (
                <UncategorisedTransactionsList
                    transactions={suggestedTransactions}
                    categories={categories}
                    onCategoryChange={handleManualCategoryChange}
                    onRemoveTransaction={handleRemoveTransaction}
                />
            )}
        </div>
    );
} 