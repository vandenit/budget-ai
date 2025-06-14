"use client";

import { useState } from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { updateScheduledTransaction, deleteScheduledTransaction, ScheduledTransactionUpdate } from '../../../api/scheduledTransactions.client';
import { Category } from 'common-ts';
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
};

export const FutureChangesTable = ({ predictionData, budgetUuid, categories }: Props) => {
    const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<{
        amount: number;
        categoryId: string;
        date: string;
    } | undefined>(undefined);

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
        setSelectedTransaction({
            amount: change.amount,
            categoryId: categoryId || '',
            date: date
        });
        console.log('Dialog state set:', {
            editingTransaction: change.id,
            selectedTransaction: {
                amount: change.amount,
                categoryId: categoryId || '',
                date: date
            }
        });
    };

    return (
        <div className="space-y-4">
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

            <div className="overflow-x-auto">
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
                                        {change.amount >= 0 ? '+' : ''}{change.amount.toFixed(2)}
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
                isOpen={!!editingTransaction}
                onClose={() => {
                    console.log('Dialog closing');
                    setEditingTransaction(null);
                    setSelectedTransaction(undefined);
                }}
                onSave={handleDialogSave}
                categories={categories}
                transaction={selectedTransaction}
            />
        </div>
    );
}; 