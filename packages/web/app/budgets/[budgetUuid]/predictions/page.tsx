import { Suspense } from 'react';
import { PredictionChart } from '@/components/charts/prediction-chart';
import { getCategories } from '@/app/api/categories.client';
import { getAccounts } from '@/app/api/accounts.server';
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
            <div className="container mx-auto p-2 sm:p-4">
                <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-8">Predictions</h1>

                {/* Mobile-first layout: stack vertically on mobile, side-by-side on desktop */}
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
                    {/* Main content area - shows first on mobile */}
                    <div className="w-full lg:w-3/4 space-y-4 lg:space-y-8 order-1 lg:order-2">
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body p-3 sm:p-6">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
                                    <h2 className="card-title text-lg sm:text-xl">Chart</h2>
                                    {/* Mobile-friendly time range selector */}
                                    <div className="flex flex-wrap gap-1 sm:join">
                                        {Object.entries(TIME_RANGES).map(([range, { label }]) => (
                                            <Link
                                                key={range}
                                                href={`/budgets/${params.budgetUuid}/predictions?timeRange=${range}`}
                                                className={`btn btn-xs sm:btn-sm flex-1 sm:flex-none sm:join-item ${timeRange === range ? 'btn-primary' : 'btn-ghost'
                                                    }`}
                                            >
                                                {label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                                <div className="w-full overflow-hidden">
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
                        </div>

                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body p-3 sm:p-6">
                                <h2 className="card-title text-lg sm:text-xl mb-4">Future Changes</h2>
                                <FutureChangesTable
                                    predictionData={predictionData}
                                    categories={categories}
                                    accounts={accounts}
                                    budgetUuid={params.budgetUuid}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - shows after main content on mobile */}
                    <div className="w-full lg:w-1/4 order-2 lg:order-1">
                        <div className="card bg-base-100 shadow-xl lg:sticky lg:top-4">
                            <div className="card-body p-3 sm:p-6">
                                <InteractiveSimulations
                                    categoryOptions={categoryOptions}
                                    initialSimulations={simulations}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
} 