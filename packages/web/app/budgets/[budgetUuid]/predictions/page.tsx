import { Suspense } from 'react';
import { PredictionChart } from '@/components/charts/prediction-chart';
import { getCategories } from '@/app/api/categories.client';
import { getPrediction } from '@/app/api/math.client';

interface PageProps {
    params: {
        budgetUuid: string;
    };
}

export default async function PredictionsPage({ params }: PageProps) {
    const [predictionData, categories] = await Promise.all([
        getPrediction(params.budgetUuid),
        getCategories(params.budgetUuid)
    ]);

    return (
        <div className="container mx-auto p-4 space-y-8">
            <h1 className="text-2xl font-bold">Predictions</h1>

            <Suspense fallback={<div className="loading loading-spinner loading-lg" />}>
                <PredictionChart
                    predictionData={predictionData}
                    categories={categories}
                    variant="detail"
                />
            </Suspense>
        </div>
    );
} 