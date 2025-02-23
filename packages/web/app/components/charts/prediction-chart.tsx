"use client";
import React, { useEffect, useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Category, MonthlyForcast } from "common-ts";
import { getPrediction } from "../../api/math.client";
import 'chartjs-adapter-date-fns';
import { enUS } from 'date-fns/locale';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
);

type Props = {
    forecast: MonthlyForcast;
    categories: Category[];
    budgetId: string;
    variant?: 'overview' | 'detail';
    selectedTimeRange?: '1m' | '3m' | '6m' | '1y';
    onTimeRangeChange?: (range: '1m' | '3m' | '6m' | '1y') => void;
};

type SimulationData = {
    [date: string]: {
        balance: number;
        balance_diff?: number;
        changes: Array<{
            amount: number;
            category: string;
            reason: string;
            is_simulation?: boolean;
            memo?: string;
        }>;
    };
};

type PredictionData = {
    [simulationName: string]: SimulationData;
};

export const PredictionChart = ({
    forecast,
    categories,
    budgetId,
    variant = 'overview',
    selectedTimeRange = '3m',
    onTimeRangeChange
}: Props) => {
    const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Function to generate a color based on index
    const getSimulationColor = (index: number) => {
        const colors = [
            "rgb(75, 192, 192)",  // cyan for actual balance
            "rgb(255, 99, 132)",  // red
            "rgb(54, 162, 235)",  // blue
            "rgb(255, 206, 86)",  // yellow
            "rgb(153, 102, 255)", // purple
            "rgb(255, 159, 64)"   // orange
        ];
        return colors[index % colors.length];
    };

    const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'nearest' as const,
            axis: 'x' as const,
            intersect: false
        },
        plugins: {
            legend: {
                position: "top" as const,
                labels: {
                    font: {
                        size: variant === 'detail' ? 12 : 10
                    }
                }
            },
            title: {
                display: true,
                text: "Balance Prediction",
                font: {
                    size: variant === 'detail' ? 20 : 16
                }
            },
            tooltip: {
                callbacks: {
                    title: function (tooltipItems: any) {
                        const date = new Date(tooltipItems[0].raw.x);
                        return `Date: ${date.toLocaleDateString('en-US', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                        })}`;
                    },
                    label: function (context: any) {
                        if (!predictionData) return [];

                        const data = context.raw;
                        const lines = [];

                        // Add balance
                        lines.push(`Balance: €${data.y.toFixed(2)}`);

                        // Add balance difference if available
                        const simulationName = context.dataset.label.endsWith('.json')
                            ? context.dataset.label
                            : context.dataset.label === "Current Balance" ? "Current Balance" : context.dataset.label + ".json";

                        const simulation = predictionData[simulationName];
                        if (!simulation) return lines;

                        const dateStr = data.x.toISOString().split('T')[0];
                        const dayData = simulation[dateStr];
                        if (!dayData) return lines;

                        if (dayData.balance_diff) {
                            lines.push(`Balance Change: €${dayData.balance_diff.toFixed(2)}`);
                        }

                        // Add changes
                        if (dayData.changes && dayData.changes.length > 0) {
                            lines.push('Changes:');
                            dayData.changes.forEach((change: any) => {
                                if (change.amount === 0) return;

                                const sign = change.amount >= 0 ? '+' : '';
                                let line = `${sign}€${change.amount.toFixed(2)} (${change.category}`;
                                if (change.reason) line += ` - ${change.reason}`;
                                line += ')';
                                if (change.is_simulation) line += ' [Simulation]';
                                lines.push(line);
                            });
                        }

                        return lines;
                    }
                }
            }
        },
        scales: {
            x: {
                type: 'time' as const,
                display: true,
                title: {
                    display: false
                },
                adapters: {
                    date: {
                        locale: enUS
                    }
                },
                time: {
                    unit: 'day' as const,
                    displayFormats: {
                        day: 'd MMM'
                    }
                },
                ticks: {
                    maxRotation: 0,
                    minRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: variant === 'detail' ? 12 : 6,
                    align: 'start',
                    font: {
                        size: variant === 'detail' ? 12 : 11
                    },
                    display: variant === 'detail'
                }
            },
            y: {
                type: 'linear' as const,
                display: true,
                title: {
                    display: false
                },
                position: 'left' as const,
                beginAtZero: true,
                ticks: {
                    callback: function (tickValue: string | number): string {
                        return `€${Number(tickValue).toFixed(0)}`;
                    },
                    maxTicksLimit: variant === 'detail' ? 10 : 8,
                    font: {
                        size: variant === 'detail' ? 12 : 11
                    }
                },
                grid: {
                    color: 'rgba(200, 200, 200, 0.2)'
                }
            }
        }
    } as const;

    useEffect(() => {
        const fetchPredictionData = async () => {
            try {
                const data = await getPrediction(budgetId);
                setPredictionData(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred while fetching prediction data');
                console.error('Error fetching prediction data:', err);
            }
        };

        fetchPredictionData();
    }, [budgetId]);

    if (error) {
        return <div className="alert alert-error">{error}</div>;
    }

    if (!predictionData) {
        return <div className="loading loading-spinner loading-lg"></div>;
    }

    // Collect all unique dates from all simulations
    const allDates = new Set<string>();
    Object.values(predictionData).forEach(simulation => {
        Object.keys(simulation).forEach(date => allDates.add(date));
    });
    const sortedDates = Array.from(allDates).sort();

    // Filter dates based on selected time range
    const now = new Date();
    const timeRangeInMonths = {
        '1m': 1,
        '3m': 3,
        '6m': 6,
        '1y': 12
    }[selectedTimeRange];

    const endDate = new Date(now);
    endDate.setMonth(now.getMonth() + timeRangeInMonths);

    const filteredDates = sortedDates.filter(date => {
        const dateObj = new Date(date);
        return dateObj >= now && dateObj <= endDate;
    });

    const datasets = Object.entries(predictionData).map(([simulationName, simulationData], index) => {
        const displayName = simulationName === "Actual Balance"
            ? "Current Balance"
            : simulationName.replace(".json", "").split("_").map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(" ");

        const color = getSimulationColor(simulationName === "Actual Balance" ? 0 : index + 1);

        const dataPoints = filteredDates
            .filter(date => {
                const data = simulationData[date];
                return data && data.balance_diff !== 0;
            })
            .map(date => ({
                x: new Date(date),
                y: simulationData[date].balance
            }));

        return {
            label: displayName,
            data: dataPoints,
            borderColor: color,
            backgroundColor: 'transparent',
            borderWidth: variant === 'detail' ? 2 : 1.5,
            tension: 0.1,
            pointRadius: 2,
            pointHoverRadius: 4,
            datalabels: {
                display: false  // Verberg de datalabels
            }
        };
    });

    const chartData = {
        datasets
    };

    return (
        <div className="space-y-4">
            {variant === 'detail' && onTimeRangeChange && (
                <div className="flex justify-end space-x-2">
                    <div className="join">
                        {(['1m', '3m', '6m', '1y'] as const).map((range) => (
                            <button
                                key={range}
                                className={`join-item btn btn-sm ${selectedTimeRange === range ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => onTimeRangeChange(range)}
                            >
                                {range === '1m' ? '1 month' :
                                    range === '3m' ? '3 months' :
                                        range === '6m' ? '6 months' : '1 year'}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <div className={variant === 'detail' ? 'h-full w-full' : 'h-[400px]'}>
                <Line options={baseOptions} data={chartData} />
            </div>
        </div>
    );
};

export default PredictionChart; 