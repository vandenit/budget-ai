import { Suspense } from 'react';
import Loading from '../../../components/Loading';
import UncategorisedTransactionsContent from './UncategorisedTransactionsContent';
import { getCachedSuggestions } from '../../../api/math.server';
import { getCategories } from '../../../api/categories.client';
import BudgetSubNavigation from '../../../components/budget-sub-navigation';

interface PageProps {
    params: {
        budgetUuid: string;
    };
}

export default async function UncategorisedTransactionsPage({ params }: PageProps) {
    const budgetUuid = params.budgetUuid;

    try {
        // Get categories and cached suggestions in parallel
        const [categories, cachedResult] = await Promise.all([
            getCategories(budgetUuid),
            getCachedSuggestions(budgetUuid)
        ]);

        // Transform cached suggestions into transaction format for frontend
        const transactions = cachedResult.uncategorized_transactions?.map((tx: any) => {
            const suggestion = cachedResult.suggestions?.[tx.id];

            return {
                transaction_id: tx.id,
                payee_name: tx.payee_name,
                amount: tx.amount,
                date: tx.date,
                suggested_category_name: suggestion?.suggested_category_name || null,
                loading_suggestion: !suggestion, // Need to load if no cached suggestion
                cached: suggestion?.cached || false
            };
        }) || [];

        console.log(`🏦 Loaded uncategorised page with ${transactions.length} transactions`);
        console.log(`💾 ${cachedResult.cache_stats?.cached_count || 0} cached suggestions available`);

        return (
            <>
                <BudgetSubNavigation budgetUuid={budgetUuid} />
                <div className="container mx-auto p-4">
                    <h1 className="text-3xl font-bold mb-6 dark:text-white">Uncategorised Transactions</h1>
                    <UncategorisedTransactionsContent
                        budgetUuid={budgetUuid}
                        categories={categories}
                        initialTransactions={transactions}
                    />
                </div>
            </>
        );
    } catch (error) {
        console.error('Error loading uncategorised transactions:', error);
        return (
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-6 text-red-600">Error Loading Transactions</h1>
                <p className="text-gray-600">
                    Failed to load uncategorised transactions. Please try again.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                    Error: {error instanceof Error ? error.message : 'Unknown error'}
                </p>
            </div>
        );
    }
} 