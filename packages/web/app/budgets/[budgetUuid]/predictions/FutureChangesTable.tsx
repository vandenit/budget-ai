"use client";

import { useEffect, useState } from 'react';
import { getPrediction } from '../../../api/math.client';

type Change = {
    amount: number;
    category: string;
    reason: string;
    is_simulation?: boolean;
    memo?: string;
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
    budgetId: string;
};

export const FutureChangesTable = ({ budgetId }: Props) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [changes, setChanges] = useState<DayChanges[]>([]);

    useEffect(() => {
        const fetchChanges = async () => {
            try {
                setIsLoading(true);
                const data = await getPrediction(budgetId) as PredictionData;

                // Alleen de "Actual Balance" simulatie gebruiken
                const actualBalanceSimulation = data["Actual Balance"];
                const allChanges: DayChanges[] = [];
                const seenChanges = new Set<string>();

                if (actualBalanceSimulation) {
                    Object.entries(actualBalanceSimulation).forEach(([date, dayData]) => {
                        if (dayData.changes && dayData.changes.length > 0) {
                            // Filter duplicaten uit changes array
                            const uniqueChanges = dayData.changes.filter(change => {
                                // Maak een unieke key voor elke verandering
                                const changeKey = `${date}-${change.category}-${change.amount}-${change.reason}`;
                                if (seenChanges.has(changeKey)) {
                                    return false;
                                }
                                seenChanges.add(changeKey);
                                return true;
                            });

                            if (uniqueChanges.length > 0) {
                                allChanges.push({
                                    date,
                                    balance: dayData.balance,
                                    balance_diff: dayData.balance_diff,
                                    changes: uniqueChanges
                                });
                            }
                        }
                    });
                }

                // Sort by date
                allChanges.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                setChanges(allChanges);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred while fetching the changes');
                console.error('Error fetching changes:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchChanges();
    }, [budgetId]);

    if (isLoading) {
        return <div className="loading loading-spinner loading-lg"></div>;
    }

    if (error) {
        return <div className="alert alert-error">{error}</div>;
    }

    return (
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
                                        <span>{change.reason}</span>
                                    </div>
                                    {change.memo && (
                                        <span className="text-sm text-base-content/70">{change.memo}</span>
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
    );
}; 