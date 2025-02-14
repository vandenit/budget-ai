"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { MonthlyForcast } from "common-ts";
import { PredictionChart } from "../../../components/charts/prediction-chart";
import { FutureChangesTable } from "./FutureChangesTable";

export default function PredictionsPage() {
    const params = useParams();
    const budgetId = params.budgetUuid as string;

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [forecast, setForecast] = useState<MonthlyForcast | null>(null);
    const [selectedTimeRange, setSelectedTimeRange] = useState<'1m' | '3m' | '6m' | '1y'>('3m');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setForecast({} as MonthlyForcast);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred while fetching the data');
                console.error('Error fetching prediction data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [budgetId]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="loading loading-spinner loading-lg"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <div className="alert alert-error">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 space-y-8">
            <h1 className="text-2xl font-bold mb-6">Predictions</h1>

            <div className="bg-base-200 rounded-lg p-4">
                <div className="h-[600px] w-full">
                    {forecast && (
                        <PredictionChart
                            forecast={forecast}
                            budgetId={budgetId}
                            variant="detail"
                            selectedTimeRange={selectedTimeRange}
                            onTimeRangeChange={setSelectedTimeRange}
                        />
                    )}
                </div>
            </div>

            <div className="bg-base-200 rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4">Future Changes</h2>
                <FutureChangesTable budgetId={budgetId} />
            </div>
        </div>
    );
} 