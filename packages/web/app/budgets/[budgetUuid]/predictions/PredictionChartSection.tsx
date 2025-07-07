import { PredictionChart } from '@/components/charts/prediction-chart';
import { getCategories } from '@/app/api/categories.client';
import { getPrediction } from '@/app/api/math.server';
import { TimeRange, TIME_RANGES } from './constants';

interface PredictionChartSectionProps {
    budgetUuid: string;
    timeRange: TimeRange;
}

export default async function PredictionChartSection({ budgetUuid, timeRange }: PredictionChartSectionProps) {
    const daysAhead = TIME_RANGES[timeRange].days;

    const [predictionData, categories] = await Promise.all([
        getPrediction(budgetUuid, daysAhead),
        getCategories(budgetUuid),
    ]);

    return (
        <PredictionChart
            predictionData={predictionData}
            categories={categories}
            variant="detail"
            selectedTimeRange={timeRange}
        />
    );
}
