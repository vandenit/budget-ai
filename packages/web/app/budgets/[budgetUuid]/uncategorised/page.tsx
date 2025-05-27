import { Suspense } from 'react';
import Loading from '../../../components/Loading';
import TransactionsPageWithTabs from './TransactionsPageWithTabs';
import { getCachedSuggestions } from '../../../api/math.server';
import { getCategories } from '../../../api/categories.client';
import { getUnapprovedTransactions } from './actions';
import BudgetSubNavigation from '../../../components/budget-sub-navigation';

interface PageProps {
    params: {
        budgetUuid: string;
    };
}

export default async function UncategorisedTransactionsPage({ params }: PageProps) {
    const budgetUuid = params.budgetUuid;

    try {
        // Get categories, cached suggestions, and unapproved transactions in parallel
        const [categories, cachedResult, unapprovedTransactions] = await Promise.all([
            getCategories(budgetUuid),
            getCachedSuggestions(budgetUuid),
            getUnapprovedTransactions(budgetUuid)
        ]);

        // Transform cached suggestions into transaction format for frontend
        const uncategorizedTransactions = cachedResult.uncategorized_transactions?.map((tx: any) => {
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

        console.log(`🏦 Loaded transactions page with ${uncategorizedTransactions.length} uncategorized and ${unapprovedTransactions.length} unapproved transactions`);
        console.log(`💾 ${cachedResult.cache_stats?.cached_count || 0} cached suggestions available`);

        return (
            <>
                <BudgetSubNavigation budgetUuid={budgetUuid} />
                <div className="container mx-auto p-4">
                    <h1 className="text-3xl font-bold mb-6 dark:text-white">Transactions</h1>

                    <TransactionsPageWithTabs
                        budgetUuid={budgetUuid}
                        categories={categories}
                        uncategorizedTransactions={uncategorizedTransactions}
                        unapprovedTransactions={unapprovedTransactions}
                    />
                </div>
            </>
        );
    } catch (error) {
        console.error('Error loading transactions:', error);
        return (
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-6 text-red-600">Error Loading Transactions</h1>
                <p className="text-gray-600">
                    Failed to load transactions. Please try again.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                    Error: {error instanceof Error ? error.message : 'Unknown error'}
                </p>
            </div>
        );
    }
} 