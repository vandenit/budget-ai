import TransactionsPageWithTabs from './TransactionsPageWithTabs';
import { getUncategorizedTransactions } from '../../../api/ai-suggestions.server';
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
        // Get categories, uncategorized transactions (with cached suggestions), and unapproved transactions in parallel
        const [categories, uncategorizedTransactions, unapprovedTransactions] = await Promise.all([
            getCategories(budgetUuid),
            getUncategorizedTransactions(budgetUuid),
            getUnapprovedTransactions(budgetUuid)
        ]);

        // Transform Node.js response to match frontend expectations
        const formattedUncategorizedTransactions = uncategorizedTransactions.map((tx: any) => ({
            transaction_id: tx.transaction_id,
            payee_name: tx.payee_name,
            amount: tx.amount,
            date: tx.date,
            suggested_category_name: tx.ai_suggested_category || null,
            loading_suggestion: !tx.ai_suggested_category, // Need to load if no cached suggestion
            cached: !!tx.ai_suggested_category
        }));

        const cachedCount = formattedUncategorizedTransactions.filter(tx => tx.cached).length;

        console.log(`🏦 Loaded transactions page with ${formattedUncategorizedTransactions.length} uncategorized and ${unapprovedTransactions.length} unapproved transactions`);
        console.log(`💾 ${cachedCount} cached suggestions available`);

        return (
            <>
                <BudgetSubNavigation budgetUuid={budgetUuid} />
                <div className="container mx-auto p-4">
                    <h1 className="text-3xl font-bold mb-6 dark:text-white">Transactions</h1>

                    <TransactionsPageWithTabs
                        budgetUuid={budgetUuid}
                        categories={categories}
                        uncategorizedTransactions={formattedUncategorizedTransactions}
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