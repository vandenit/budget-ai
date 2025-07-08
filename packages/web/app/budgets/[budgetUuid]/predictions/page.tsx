import { Suspense } from 'react';
import Link from 'next/link';
import { TimeRange, TIME_RANGES, DEFAULT_TIME_RANGE } from './constants';
import BudgetSubNavigation from '../../../components/budget-sub-navigation';
import Loading from '../../../components/Loading';
import PredictionChartSection from './PredictionChartSection';
import FutureChangesSection from './FutureChangesSection';
import InteractiveSimulationsSection from './InteractiveSimulationsSection';

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
                                        <PredictionChartSection
                                            budgetUuid={params.budgetUuid}
                                            timeRange={timeRange}
                                        />
                                    </Suspense>
                                </div>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body p-3 sm:p-6">
                                <h2 className="card-title text-lg sm:text-xl mb-4">Future Changes</h2>
                                <Suspense fallback={<Loading />}>
                                    <FutureChangesSection
                                        budgetUuid={params.budgetUuid}
                                        timeRange={timeRange}
                                    />
                                </Suspense>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - shows after main content on mobile */}
                    <div className="w-full lg:w-1/4 order-2 lg:order-1">
                        <div className="card bg-base-100 shadow-xl lg:sticky lg:top-4">
                            <div className="card-body p-3 sm:p-6">
                                <h2 className="card-title text-lg sm:text-xl mb-4">Simulations</h2>
                                <Suspense fallback={<Loading />}>
                                    <InteractiveSimulationsSection
                                        budgetUuid={params.budgetUuid}
                                    />
                                </Suspense>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
} 