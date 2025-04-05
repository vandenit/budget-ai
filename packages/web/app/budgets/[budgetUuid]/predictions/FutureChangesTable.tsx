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
    predictionData: PredictionData;
};

export const FutureChangesTable = ({ predictionData }: Props) => {
    const simulations = Object.keys(predictionData);
    const selectedSimulation = "Actual Balance"; // We can make this configurable later if needed

    // Process the data
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

    return (
        <div className="space-y-4">
            <div className="tabs tabs-boxed justify-start">
                {simulations.map((simulation) => (
                    <button
                        key={simulation}
                        className={`tab ${selectedSimulation === simulation ? 'tab-active' : ''}`}
                        disabled={simulation !== selectedSimulation} // We can remove this when we make it configurable
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
        </div>
    );
}; 