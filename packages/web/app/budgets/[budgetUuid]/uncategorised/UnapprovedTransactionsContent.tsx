"use client";

import React, { useState, useEffect } from 'react';
import { Category } from 'common-ts';
import UnapprovedTransactionsList from './UnapprovedTransactionsList';
import UnapprovedStats from './UnapprovedStats';
import { approveSingleTransaction, approveAllTransactions, applySingleCategory } from './actions';

export interface UnapprovedTransaction {
    transaction_id: string;
    payee_name: string;
    amount: number;
    date: string;
    memo: string;
    category_name?: string;
    category_id?: string;
    approved: boolean;
}

interface Props {
    budgetUuid: string;
    categories: Category[];
    initialTransactions: UnapprovedTransaction[];
}

export default function UnapprovedTransactionsContent({
    budgetUuid,
    categories,
    initialTransactions
}: Props) {
    const [unapprovedTransactions, setUnapprovedTransactions] = useState<UnapprovedTransaction[]>(initialTransactions);
    const [isApproving, setIsApproving] = useState(false);
    const [approvingTransactions, setApprovingTransactions] = useState<Set<string>>(new Set());
    const [lastApproveResult, setLastApproveResult] = useState<any>(null);

    // ✅ Sync local state with server data when it changes (after revalidatePath)
    useEffect(() => {
        console.log('🔄 Server data changed, syncing unapproved transactions...');
        setUnapprovedTransactions(initialTransactions);
    }, [initialTransactions]);

    // Sync local state with props when server data changes (after revalidatePath)
    useEffect(() => {
        setUnapprovedTransactions(initialTransactions);
    }, [initialTransactions]);

    const handleApproveAll = async () => {
        setIsApproving(true);
        try {
            const result = await approveAllTransactions(budgetUuid);
            setLastApproveResult(result);

            // Server data will refresh via revalidatePath - no need to manually update state
        } catch (error) {
            console.error('Error approving all transactions:', error);
            setLastApproveResult({ error: 'Failed to approve all transactions' });
        } finally {
            setIsApproving(false);
        }
    };

    const handleApproveSingle = async (transactionId: string) => {
        // Add to approving set
        setApprovingTransactions(prev => new Set([...prev, transactionId]));

        try {
            const result = await approveSingleTransaction(budgetUuid, transactionId);

            if (result.success) {
                // Show success message - server data will refresh via revalidatePath
                setLastApproveResult({
                    message: `✅ Transaction approved`,
                    approved_count: 1
                });

                console.log(`✅ Successfully approved transaction ${transactionId}`);
            }
        } catch (error) {
            console.error('Error approving single transaction:', error);
            setLastApproveResult({
                error: `Failed to approve transaction: ${error}`
            });
        } finally {
            // Remove from approving set
            setApprovingTransactions(prev => {
                const newSet = new Set(prev);
                newSet.delete(transactionId);
                return newSet;
            });
        }
    };

    const handleCategorizeAndApprove = async (transactionId: string, categoryName: string) => {
        // Add to approving set
        setApprovingTransactions(prev => new Set([...prev, transactionId]));

        try {
            // Use the existing applySingleCategory which does categorization + approval + learning
            const result = await applySingleCategory(budgetUuid, transactionId, categoryName);

            if (result.success) {
                // Show success message - server data will refresh via revalidatePath
                setLastApproveResult({
                    message: `✅ Applied '${categoryName}' and approved transaction`,
                    approved_count: 1
                });

                console.log(`✅ Successfully categorized and approved transaction ${transactionId}`);
            }
        } catch (error) {
            console.error('Error categorizing and approving transaction:', error);
            setLastApproveResult({
                error: `Failed to categorize and approve transaction: ${error}`
            });
        } finally {
            // Remove from approving set
            setApprovingTransactions(prev => {
                const newSet = new Set(prev);
                newSet.delete(transactionId);
                return newSet;
            });
        }
    };

    const totalCount = unapprovedTransactions.length;
    const categorizedCount = unapprovedTransactions.filter(tx => tx.category_name).length;
    const uncategorizedCount = totalCount - categorizedCount;

    return (
        <div className="space-y-6">
            {/* Stats and Actions */}
            <UnapprovedStats
                totalTransactions={totalCount}
                categorizedCount={categorizedCount}
                uncategorizedCount={uncategorizedCount}
                onApproveAll={handleApproveAll}
                isApproving={isApproving}
                lastResult={lastApproveResult}
            />

            {/* Results Alert */}
            {lastApproveResult && (
                <div className={`alert ${lastApproveResult.error ? 'alert-error' : 'alert-success'}`}>
                    <span>
                        {lastApproveResult.error
                            ? lastApproveResult.error
                            : lastApproveResult.message
                                ? lastApproveResult.message
                                : `Successfully approved ${lastApproveResult.approved_count} transaction${lastApproveResult.approved_count !== 1 ? 's' : ''}!`
                        }
                    </span>
                </div>
            )}

            {/* Transactions List */}
            {unapprovedTransactions.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-2xl font-bold mb-2">All transactions are approved!</h2>
                    <p className="text-gray-600">No unapproved transactions found.</p>
                </div>
            ) : (
                <UnapprovedTransactionsList
                    transactions={unapprovedTransactions}
                    categories={categories}
                    approvingTransactions={approvingTransactions}
                    onApproveSingle={handleApproveSingle}
                    onCategorizeAndApprove={handleCategorizeAndApprove}
                />
            )}
        </div>
    );
} 