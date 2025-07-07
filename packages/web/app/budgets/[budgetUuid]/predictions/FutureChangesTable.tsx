"use client";

import { useState } from 'react';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import { updateScheduledTransaction, deleteScheduledTransaction, createScheduledTransaction, ScheduledTransactionUpdate, ScheduledTransactionCreate } from '../../../api/scheduledTransactions.client';
import { Category } from 'common-ts';
import { Account } from '../../../api/accounts.server';
import { EditTransactionDialog } from './EditTransactionDialog';

type Change = {
    amount: number;
    category: string;
    reason: string;
    is_simulation?: boolean;
    memo?: string;
    id?: string;
    account?: string;
    payee?: string;
};

type DayData = {
    balance: number;
    balance_diff: number;
    changes: Change[];
};

type SimulationData = {
    [date: string]: DayData;
};

type PredictionData = {
    [simulationName: string]: SimulationData;
};

type DayChanges = {
    date: string;
    balance: number;
    balance_diff: number;
    changes: Change[];
};

type Props = {
    predictionData: PredictionData;
    budgetUuid: string;
    categories: Category[];
    accounts: Account[];
};

export const FutureChangesTable = ({ predictionData, budgetUuid, categories, accounts }: Props) => {
    const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<{
        amount: number;
        categoryId: string;
        date: string;
        payeeName?: string;
        memo?: string;
        accountId?: string;
    } | undefined>(undefined);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    const handleEdit = async (transactionId: string, updates: ScheduledTransactionUpdate) => {
        if (!transactionId) return;
        try {
            await updateScheduledTransaction(budgetUuid, transactionId, updates);
            // TODO: Add toast notification
            setEditingTransaction(null);
            setSelectedTransaction(undefined);
        } catch (error) {
            console.error('Failed to update transaction:', error);
            // TODO: Add error toast
        }
    };

    const handleDelete = async (transactionId: string) => {
        if (!transactionId) return;
        try {
            await deleteScheduledTransaction(budgetUuid, transactionId);
            // TODO: Add toast notification
            setEditingTransaction(null);
            setSelectedTransaction(undefined);
        } catch (error) {
            console.error('Failed to delete transaction:', error);
            // TODO: Add error toast
        }
    };

    const handleCreate = async (data: ScheduledTransactionCreate) => {
        try {
            await createScheduledTransaction(budgetUuid, data);
            // TODO: Add toast notification
            setIsCreateDialogOpen(false);
            // Refresh the data by calling the parent's onUpdate if available
            // For now, we'll just close the dialog
        } catch (error) {
            console.error('Failed to create transaction:', error);
            // TODO: Add error toast
            throw error; // Re-throw to let the dialog handle the error
        }
    };

    // Process the data
    const simulations = Object.keys(predictionData);
    const selectedSimulation = "Actual Balance"; // We can make this configurable later if needed
    const selectedData = predictionData[selectedSimulation];
    const changes: DayChanges[] = [];

    if (selectedData) {
        Object.entries(selectedData).forEach(([date, dayData]) => {
            if (dayData.changes && dayData.changes.length > 0) {
                changes.push({
                    date,
                    balance: dayData.balance,
                    balance_diff: dayData.balance_diff,
                    changes: dayData.changes
                });
            }
        });
    }

    // Sort by date
    changes.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const formatSimulationName = (name: string) => {
        if (name === "Actual Balance") return name;
        return name.replace(".json", "").split("_").map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(" ");
    };

    const handleDialogSave = async (updates: ScheduledTransactionUpdate) => {
        if (!editingTransaction) return;
        await handleEdit(editingTransaction, updates);
    };

    const handleEditClick = (change: Change, date: string) => {
        console.log('Edit clicked:', { change, date });
        if (!change.id) {
            console.log('No transaction ID found');
            return;
        }

        // Find the category ID based on the category name
        const categoryId = categories.find(cat => cat.name === change.category)?.uuid;

        setEditingTransaction(change.id);
        // Find account based on change.account if available
        const accountId = change.account ? accounts.find(acc => acc.name === change.account)?.uuid : undefined;

        setSelectedTransaction({
            amount: change.amount,
            categoryId: categoryId || '',
            date: date,
            payeeName: change.payee || '',
            memo: change.memo || '',
            accountId: accountId || ''
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="tabs tabs-boxed justify-start">
                    {simulations.map((simulation) => (
                        <button
                            key={simulation}
                            className={`tab ${selectedSimulation === simulation ? 'tab-active' : ''}`}
                            disabled={simulation !== selectedSimulation}
                        >
                            {formatSimulationName(simulation)}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="btn btn-primary btn-sm"
                >
                    <FiPlus className="h-4 w-4" />
                    Add Transaction
                </button>
            </div>

            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-4">
                {changes.map((dayChange, dayIndex) => (
                    <div key={dayIndex} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        {/* Date Header */}
                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 p-4 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-lg">
                                    {new Date(dayChange.date).toLocaleDateString('en-US', {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </h3>
                                <div className="text-right">
                                    <div className="font-semibold">€{dayChange.balance.toFixed(2)}</div>
                                    <div className={`text-sm ${dayChange.balance_diff >= 0 ? 'text-success' : 'text-error'}`}>
                                        {dayChange.balance_diff >= 0 ? '+' : ''}{dayChange.balance_diff.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Changes */}
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                            {dayChange.changes.map((change, changeIndex) => (
                                <div key={changeIndex} className="p-4">
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                {change.is_simulation && (
                                                    <span className="badge badge-sm">Simulation</span>
                                                )}
                                                <span className="font-medium">{change.reason}</span>
                                            </div>

                                            {change.payee && (
                                                <div className="text-sm text-base-content/70 mb-1">{change.payee}</div>
                                            )}

                                            {change.memo && (
                                                <div className="text-sm text-base-content/70 mb-2">{change.memo}</div>
                                            )}

                                            <div className="text-sm text-base-content/80">{change.category}</div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {change.reason === "Scheduled Transaction" && (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => {
                                                            console.log('Edit button clicked for:', change);
                                                            handleEditClick(change, dayChange.date);
                                                        }}
                                                        className="btn btn-ghost btn-xs"
                                                    >
                                                        <FiEdit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => change.id && handleDelete(change.id)}
                                                        className="btn btn-ghost btn-xs text-error"
                                                    >
                                                        <FiTrash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                            <div className={`text-right font-semibold ${change.amount >= 0 ? 'text-success' : 'text-error'}`}>
                                                {change.amount >= 0 ? '+' : ''}€{change.amount.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="table table-zebra w-full">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Category</th>
                            <th className="text-right">Amount</th>
                            <th className="text-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {changes.map((dayChange, dayIndex) => (
                            dayChange.changes.map((change, changeIndex) => (
                                <tr key={`${dayIndex}-${changeIndex}`}>
                                    {changeIndex === 0 && (
                                        <td rowSpan={dayChange.changes.length} className="font-medium">
                                            {new Date(dayChange.date).toLocaleDateString('en-US', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </td>
                                    )}
                                    <td>
                                        <div className="flex items-center gap-2">
                                            {change.is_simulation && (
                                                <span className="badge badge-sm">Simulation</span>
                                            )}
                                            {change.reason === "Scheduled Transaction" && (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => {
                                                            console.log('Edit button clicked for:', change);
                                                            handleEditClick(change, dayChange.date);
                                                        }}
                                                        className="btn btn-ghost btn-xs"
                                                    >
                                                        <FiEdit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => change.id && handleDelete(change.id)}
                                                        className="btn btn-ghost btn-xs text-error"
                                                    >
                                                        <FiTrash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                            <div>
                                                <span>{change.reason}</span>
                                                {change.payee && (
                                                    <span className="text-sm text-base-content/70 block">{change.payee}</span>
                                                )}
                                            </div>
                                        </div>
                                        {change.memo && (
                                            <span className="text-sm text-base-content/70 block">{change.memo}</span>
                                        )}
                                    </td>
                                    <td>{change.category}</td>
                                    <td className={`text-right ${change.amount >= 0 ? 'text-success' : 'text-error'}`}>
                                        {change.amount >= 0 ? '+' : ''}€{change.amount.toFixed(2)}
                                    </td>
                                    {changeIndex === 0 && (
                                        <td rowSpan={dayChange.changes.length} className="text-right">
                                            €{dayChange.balance.toFixed(2)}
                                            <div className={`text-sm ${dayChange.balance_diff >= 0 ? 'text-success' : 'text-error'}`}>
                                                {dayChange.balance_diff >= 0 ? '+' : ''}{dayChange.balance_diff.toFixed(2)}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ))}
                    </tbody>
                </table>
            </div>

            <EditTransactionDialog
                key={`edit-${editingTransaction}`}
                isOpen={!!editingTransaction}
                onClose={() => {
                    console.log('Dialog closing');
                    setEditingTransaction(null);
                    setSelectedTransaction(undefined);
                }}
                onSave={handleDialogSave}
                categories={categories}
                accounts={accounts}
                budgetUuid={budgetUuid}
                transaction={selectedTransaction}
                mode="edit"
            />

            <EditTransactionDialog
                key="create"
                isOpen={isCreateDialogOpen}
                onClose={() => setIsCreateDialogOpen(false)}
                onCreate={handleCreate}
                categories={categories}
                accounts={accounts}
                budgetUuid={budgetUuid}
                mode="create"
            />
        </div>
    );
}; 