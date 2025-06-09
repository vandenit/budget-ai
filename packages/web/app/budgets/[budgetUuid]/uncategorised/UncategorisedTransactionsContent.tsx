"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Category } from 'common-ts';
import { applyCategories, applyAllCategories, getSuggestionsAsync, getSingleSuggestion, applySingleCategory } from './actions';
import UncategorisedTransactionsList from './UncategorisedTransactionsList';
import UncategorisedStats from './UncategorisedStats';

export interface SuggestedTransaction {
    transaction_id: string;
    payee_name: string;
    amount: number;
    date: string;
    suggested_category_name: string | null;
    loading_suggestion?: boolean;
    cached?: boolean;
}

interface Props {
    budgetUuid: string;
    categories: Category[];
    initialTransactions: SuggestedTransaction[];
}

export default function UncategorisedTransactionsContent({
    budgetUuid,
    categories,
    initialTransactions
}: Props) {
    const [suggestedTransactions, setSuggestedTransactions] = useState<SuggestedTransaction[]>(initialTransactions);
    const [manuallyModified, setManuallyModified] = useState<Set<string>>(new Set());
    const [isApplying, setIsApplying] = useState(false);
    const [applyingTransactions, setApplyingTransactions] = useState<Set<string>>(new Set());
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [lastApplyResult, setLastApplyResult] = useState<any>(null);
    const hasLoadedSuggestions = useRef(false);
    const manuallyModifiedRef = useRef(manuallyModified);

    // Keep ref in sync with state
    useEffect(() => {
        manuallyModifiedRef.current = manuallyModified;
    }, [manuallyModified]);

    // Load missing AI suggestions with concurrent processing
    useEffect(() => {
        if (hasLoadedSuggestions.current) return; // Prevent multiple loads

        const loadMissingSuggestionsWithConcurrency = async () => {
            // Find transactions that need AI suggestions
            const transactionsNeedingSuggestions = initialTransactions.filter(
                tx => tx.loading_suggestion && !tx.suggested_category_name
            );

            if (transactionsNeedingSuggestions.length === 0) {
                hasLoadedSuggestions.current = true;
                return;
            }

            console.log(`🚀 Loading AI suggestions for ${transactionsNeedingSuggestions.length} transactions with concurrent processing...`);
            setIsLoadingSuggestions(true);

            // Configuration for concurrent processing
            const MAX_CONCURRENT = 10; // Max concurrent calls
            let activePromises = 0;
            let processedCount = 0;
            let successCount = 0;
            let errorCount = 0;

            // Process single transaction
            const processSingleTransaction = async (transaction: SuggestedTransaction) => {
                try {
                    const result = await getSingleSuggestion(budgetUuid, transaction.transaction_id, {
                        id: transaction.transaction_id,
                        payee_name: transaction.payee_name,
                        amount: transaction.amount,
                        date: transaction.date
                    });

                    // Double-check if this transaction was manually modified during the AI call
                    // Use the most current state by checking both ref AND current component state
                    setSuggestedTransactions(prev => {
                        const currentTransaction = prev.find(tx => tx.transaction_id === transaction.transaction_id);
                        const isCurrentlyManuallyModified = manuallyModifiedRef.current.has(transaction.transaction_id);

                        // Additional safety: check if the transaction still exists and hasn't been removed
                        if (!currentTransaction) {
                            console.log(`🚫 Transaction ${transaction.transaction_id} no longer exists, skipping AI suggestion`);
                            return prev; // No changes
                        }

                        if (isCurrentlyManuallyModified) {
                            console.log(`🚫 Skipping AI suggestion for manually modified transaction: ${transaction.payee_name}`);
                            // Just update loading state but keep the manual category
                            return prev.map(tx =>
                                tx.transaction_id === transaction.transaction_id
                                    ? {
                                        ...tx,
                                        loading_suggestion: false,
                                        cached: result.cached
                                    }
                                    : tx
                            );
                        } else {
                            console.log(`✅ Applying AI suggestion for: ${transaction.payee_name} → ${result.suggested_category_name}`);
                            // Apply AI suggestion only if not manually modified
                            return prev.map(tx =>
                                tx.transaction_id === transaction.transaction_id
                                    ? {
                                        ...tx,
                                        suggested_category_name: result.suggested_category_name,
                                        loading_suggestion: false,
                                        cached: result.cached
                                    }
                                    : tx
                            );
                        }
                    });

                    successCount++;
                    console.log(`✅ ${result.cached ? '(cached)' : `(${result.processing_time_ms}ms)`} ${transaction.payee_name} → ${result.suggested_category_name}`);

                } catch (error) {
                    console.error(`❌ Failed to get suggestion for ${transaction.payee_name}:`, error);

                    // Mark this transaction as failed
                    setSuggestedTransactions(prev =>
                        prev.map(tx =>
                            tx.transaction_id === transaction.transaction_id
                                ? { ...tx, loading_suggestion: false }
                                : tx
                        )
                    );
                    errorCount++;
                } finally {
                    activePromises--;
                    processedCount++;

                    // Log progress
                    console.log(`📊 Progress: ${processedCount}/${transactionsNeedingSuggestions.length} (${successCount} success, ${errorCount} errors, ${activePromises} active)`);
                }
            };

            // Queue processing with concurrency limit
            let currentIndex = 0;

            const processNext = async () => {
                while (currentIndex < transactionsNeedingSuggestions.length && activePromises < MAX_CONCURRENT) {
                    const transaction = transactionsNeedingSuggestions[currentIndex];
                    currentIndex++;
                    activePromises++;

                    // Start processing (don't await here to allow concurrency)
                    processSingleTransaction(transaction).then(() => {
                        // Start next transaction if available
                        if (currentIndex < transactionsNeedingSuggestions.length) {
                            processNext();
                        }
                    });
                }
            };

            // Start initial batch
            await processNext();

            // Wait for all to complete
            const checkCompletion = () => {
                return new Promise<void>((resolve) => {
                    const checkInterval = setInterval(() => {
                        if (processedCount >= transactionsNeedingSuggestions.length) {
                            clearInterval(checkInterval);
                            resolve();
                        }
                    }, 100);
                });
            };

            await checkCompletion();

            console.log(`🎉 Completed loading ${transactionsNeedingSuggestions.length} suggestions (${successCount} success, ${errorCount} errors)`);
            setIsLoadingSuggestions(false);
            hasLoadedSuggestions.current = true;
        };

        loadMissingSuggestionsWithConcurrency();
    }, [budgetUuid, initialTransactions]);

    const handleApplyAllSuggestions = async () => {
        setIsApplying(true);
        try {
            // Apply all categories (both AI suggestions and manual changes)
            // The endpoint will automatically handle cached suggestions and manual changes
            const result = await applyAllCategories(budgetUuid);
            setLastApplyResult(result);

            // Show success message and refresh data
            if (result.updated_transactions && result.updated_transactions.length > 0) {
                // Remove applied transactions from the list
                const appliedTransactionIds = result.updated_transactions.map((r: any) => r.transaction_id);
                setSuggestedTransactions(prev =>
                    prev.filter(t => !appliedTransactionIds.includes(t.transaction_id))
                );
                // Clear manual modifications for applied transactions
                setManuallyModified(prev => {
                    const newSet = new Set(prev);
                    appliedTransactionIds.forEach((id: string) => newSet.delete(id));
                    return newSet;
                });
            }
        } catch (error) {
            console.error('Error applying suggestions:', error);
            setLastApplyResult({ error: 'Failed to apply suggestions' });
        } finally {
            setIsApplying(false);
        }
    };

    const handleApplyAISuggestionsOnly = async () => {
        setIsApplying(true);
        try {
            // Get transactions with manual changes marked
            const transactionsWithManualFlags = suggestedTransactions.map(tx => ({
                transaction_id: tx.transaction_id,
                category_name: tx.suggested_category_name,
                is_manual_change: manuallyModified.has(tx.transaction_id)
            }));

            const result = await applyCategories(budgetUuid, transactionsWithManualFlags);
            setLastApplyResult(result);

            // Show success message and refresh data
            if (result.length > 0) {
                // Remove applied transactions from the list
                const appliedTransactionIds = result.map((r: any) => r.transaction_id);
                setSuggestedTransactions(prev =>
                    prev.filter(t => !appliedTransactionIds.includes(t.transaction_id))
                );
                // Clear manual modifications for applied transactions
                setManuallyModified(prev => {
                    const newSet = new Set(prev);
                    appliedTransactionIds.forEach((id: string) => newSet.delete(id));
                    return newSet;
                });
            }
        } catch (error) {
            console.error('Error applying AI suggestions:', error);
            setLastApplyResult({ error: 'Failed to apply AI suggestions' });
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
        // Mark this transaction as manually modified
        setManuallyModified(prev => new Set([...prev, transactionId]));
    };

    const handleRemoveTransaction = (transactionId: string) => {
        setSuggestedTransactions(prev =>
            prev.filter(t => t.transaction_id !== transactionId)
        );
        // Remove from manually modified set if present
        setManuallyModified(prev => {
            const newSet = new Set(prev);
            newSet.delete(transactionId);
            return newSet;
        });
    };

    const handleApplySingleCategory = async (transactionId: string, categoryName: string) => {
        // Add to applying set
        setApplyingTransactions(prev => new Set([...prev, transactionId]));

        try {
            // Apply AI suggestion (not a manual change)
            const result = await applySingleCategory(budgetUuid, transactionId, categoryName, false);

            if (result.success) {
                // Remove the transaction from our list since it's now categorized
                setSuggestedTransactions(prev =>
                    prev.filter(t => t.transaction_id !== transactionId)
                );

                // Remove from manually modified set if present
                setManuallyModified(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(transactionId);
                    return newSet;
                });

                // Show success message
                setLastApplyResult({
                    message: `✅ Applied '${categoryName}' to transaction`,
                    applied_count: 1
                });

                console.log(`✅ Successfully applied AI suggestion '${categoryName}' to transaction ${transactionId}`);
            }
        } catch (error) {
            console.error('Error applying single category:', error);
            setLastApplyResult({
                error: `Failed to apply category: ${error}`
            });
        } finally {
            // Remove from applying set
            setApplyingTransactions(prev => {
                const newSet = new Set(prev);
                newSet.delete(transactionId);
                return newSet;
            });
        }
    };

    const handleApplyManualCategory = async (transactionId: string, categoryName: string) => {
        // Add to applying set
        setApplyingTransactions(prev => new Set([...prev, transactionId]));

        try {
            // Apply manual change (with payee learning)
            const result = await applySingleCategory(budgetUuid, transactionId, categoryName, true);

            if (result.success) {
                // Remove the transaction from our list since it's now categorized
                setSuggestedTransactions(prev =>
                    prev.filter(t => t.transaction_id !== transactionId)
                );

                // Remove from manually modified set if present
                setManuallyModified(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(transactionId);
                    return newSet;
                });

                // Show success message with learning info
                const learningInfo = result.learned_mapping ? ' (learned for future)' : '';
                setLastApplyResult({
                    message: `✅ Applied '${categoryName}' to transaction${learningInfo}`,
                    applied_count: 1
                });

                console.log(`✅ Successfully applied manual category '${categoryName}' to transaction ${transactionId}${learningInfo}`);
            }
        } catch (error) {
            console.error('Error applying manual category:', error);
            setLastApplyResult({
                error: `Failed to apply manual category: ${error}`
            });
        } finally {
            // Remove from applying set
            setApplyingTransactions(prev => {
                const newSet = new Set(prev);
                newSet.delete(transactionId);
                return newSet;
            });
        }
    };

    const manuallyModifiedCount = manuallyModified.size;
    const aiSuggestionsCount = suggestedTransactions.length - manuallyModifiedCount;

    return (
        <div className="space-y-6">
            {/* Stats and Actions */}
            <UncategorisedStats
                totalTransactions={suggestedTransactions.length}
                aiSuggestionsCount={aiSuggestionsCount}
                manuallyModifiedCount={manuallyModifiedCount}
                onApplyAll={handleApplyAllSuggestions}
                onApplyAIOnly={handleApplyAISuggestionsOnly}
                isApplying={isApplying}
                lastResult={lastApplyResult}
            />

            {/* Results Alert */}
            {lastApplyResult && (
                <div className={`alert ${lastApplyResult.error ? 'alert-error' : 'alert-success'}`}>
                    <span>
                        {lastApplyResult.error
                            ? lastApplyResult.error
                            : lastApplyResult.message
                                ? lastApplyResult.message
                                : lastApplyResult.updated_transactions
                                    ? `Successfully applied ${lastApplyResult.updated_transactions.length} suggestions! ${lastApplyResult.learned_mappings || 0} new patterns learned.`
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
                    manuallyModified={manuallyModified}
                    applyingTransactions={applyingTransactions}
                    onCategoryChange={handleManualCategoryChange}
                    onRemoveTransaction={handleRemoveTransaction}
                    onApplySingleCategory={handleApplySingleCategory}
                    onApplyManualCategory={handleApplyManualCategory}
                />
            )}
        </div>
    );
}