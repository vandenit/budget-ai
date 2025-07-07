import { getCategories } from '@/app/api/categories.client';
import { getAccounts } from '@/app/api/accounts.server';
import { getPrediction } from '@/app/api/math.server';
import { FutureChangesTable } from './FutureChangesTable';
import { TimeRange, TIME_RANGES } from './constants';

interface FutureChangesSectionProps {
    budgetUuid: string;
    timeRange: TimeRange;
}

export default async function FutureChangesSection({ budgetUuid, timeRange }: FutureChangesSectionProps) {
    const daysAhead = TIME_RANGES[timeRange].days;

    const [predictionData, categories, accounts] = await Promise.all([
        getPrediction(budgetUuid, daysAhead),
        getCategories(budgetUuid),
        getAccounts(budgetUuid)
    ]);

    return (
        <FutureChangesTable
            predictionData={predictionData}
            categories={categories}
            accounts={accounts}
            budgetUuid={budgetUuid}
        />
    );
}
