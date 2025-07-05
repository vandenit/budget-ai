import { Suspense } from 'react';
import { PredictionChart } from '@/components/charts/prediction-chart';
import { getCategories } from '@/app/api/categories.client';
import { getAccounts } from '@/app/api/accounts.client';
import { getPrediction } from '@/app/api/math.server';
import InteractiveSimulations from './InteractiveSimulations';
import { getSimulations } from './actions';
import { FutureChangesTable } from './FutureChangesTable';
import Link from 'next/link';
import { TimeRange, TIME_RANGES, DEFAULT_TIME_RANGE } from './constants';
import BudgetSubNavigation from '../../../components/budget-sub-navigation';

interface PageProps {
    params: {
        budgetUuid: string;
    };
    searchParams: {
        timeRange?: TimeRange;
    };
}

export default async function PredictionsPage({ params, searchParams }: PageProps) {
    const timeRange = searchParams.timeRange || DEFAULT_TIME_RANGE;
    const daysAhead = TIME_RANGES[timeRange].days;

    const [predictionData, categories, simulations, accounts] = await Promise.all([
        getPrediction(params.budgetUuid, daysAhead),
        getCategories(params.budgetUuid),
        getSimulations(params.budgetUuid),
        getAccounts(params.budgetUuid)
    ]);

    const categoryOptions = categories.map(category => ({ uuid: category.uuid, name: category.name }));

    return (
        <>
            <BudgetSubNavigation budgetUuid={params.budgetUuid} />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-8">Predictions</h1>

                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="w-full lg:w-1/4">
                        <InteractiveSimulations
                            categoryOptions={categoryOptions}
                            initialSimulations={simulations}
                        />
                    </div>

                    <div className="w-full lg:w-3/4 space-y-8">
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="card-title">Chart</h2>
                                    <div className="join">
                                        {Object.entries(TIME_RANGES).map(([range, { label }]) => (
                                            <Link
                                                key={range}
                                                href={`/budgets/${params.budgetUuid}/predictions?timeRange=${range}`}
                                                className={`join-item btn btn-sm ${timeRange === range ? 'btn-primary' : 'btn-ghost'}`}
                                            >
                                                {label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                                <Suspense fallback={<div className="loading loading-spinner loading-lg" />}>
                                    <PredictionChart
                                        predictionData={predictionData}
                                        categories={categories}
                                        variant="detail"
                                        selectedTimeRange={timeRange}
                                    />
                                </Suspense>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h2 className="card-title">Future Changes</h2>
                                <FutureChangesTable
                                    predictionData={predictionData}
                                    categories={categories}
                                    accounts={accounts}
                                    budgetUuid={params.budgetUuid}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
} 