import { Suspense } from 'react';
import { PredictionChart } from '@/components/charts/prediction-chart';
import { getCategories } from '@/app/api/categories.client';
import { getPrediction } from '@/app/api/math.client';
import InteractiveSimulations from './InteractiveSimulations';
import { getSession } from '@auth0/nextjs-auth0';
import { getSimulations } from './actions';

interface PageProps {
    params: {
        budgetUuid: string;
    };
}

export default async function PredictionsPage({ params }: PageProps) {
    const session = await getSession();
    const accessToken = session?.accessToken;

    if (!accessToken) {
        throw new Error('No access token available');
    }

    const [predictionData, categories, simulations] = await Promise.all([
        getPrediction(params.budgetUuid),
        getCategories(params.budgetUuid),
        getSimulations(params.budgetUuid)
    ]);

    const categoryOptions = categories.map(category => ({ uuid: category.uuid, name: category.name }));

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-8">Predictions</h1>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-1/4">
                    <InteractiveSimulations
                        categoryOptions={categoryOptions}
                        initialSimulations={simulations}
                    />
                </div>

                <div className="w-full lg:w-3/4">
                    <Suspense fallback={<div className="loading loading-spinner loading-lg" />}>
                        <PredictionChart
                            predictionData={predictionData}
                            categories={categories}
                            variant="detail"
                        />
                    </Suspense>
                </div>
            </div>
        </div>
    );
} 