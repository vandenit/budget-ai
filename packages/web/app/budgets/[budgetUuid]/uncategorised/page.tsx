import { Suspense } from 'react';
import Loading from '../../../components/Loading';
import UncategorisedTransactionsContent from './UncategorisedTransactionsContent';
import { getCategories } from '../../../api/categories.client';
import { suggestCategories } from '../../../api/math.server';
import BudgetSubNavigation from '../../../components/budget-sub-navigation';

interface PageProps {
    params: {
        budgetUuid: string;
    };
}

export default async function UncategorisedTransactionsPage({ params }: PageProps) {
    return (
        <>
            <BudgetSubNavigation budgetUuid={params.budgetUuid} />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-8">AI Assistant</h1>
                <Suspense fallback={<Loading />}>
                    <UncategorisedTransactionsInfo budgetUuid={params.budgetUuid} />
                </Suspense>
            </div>
        </>
    );
}

async function UncategorisedTransactionsInfo({ budgetUuid }: { budgetUuid: string }) {
    try {
        const [categories, suggestedTransactions] = await Promise.all([
            getCategories(budgetUuid),
            suggestCategories(budgetUuid)
        ]);

        return (
            <UncategorisedTransactionsContent
                budgetUuid={budgetUuid}
                categories={categories}
                initialSuggestedTransactions={suggestedTransactions}
            />
        );
    } catch (error) {
        console.error('Error fetching uncategorised transactions:', error);
        return (
            <div className="alert alert-error">
                <span>Error loading uncategorised transactions. Please try again later.</span>
            </div>
        );
    }
} 