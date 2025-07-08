import { Category } from 'common-ts';
import TransactionsPageWithTabs from './TransactionsPageWithTabs';
import { getUncategorizedTransactions } from '../../../api/ai-suggestions.server';
import { getUnapprovedTransactions } from './actions';

interface TransactionsDataSectionProps {
    budgetUuid: string;
    categories: Category[];
}

interface FormattedTransaction {
    transaction_id: string;
    payee_name: string;
    amount: number;
    date: string;
    suggested_category_name: string | null;
    loading_suggestion: boolean;
    cached: boolean;
}

export default async function TransactionsDataSection({ budgetUuid, categories }: TransactionsDataSectionProps) {
    try {
        // Get uncategorized transactions (with cached suggestions) and unapproved transactions in parallel
        const [uncategorizedTransactions, unapprovedTransactions] = await Promise.all([
            getUncategorizedTransactions(budgetUuid),
            getUnapprovedTransactions(budgetUuid)
        ]);

        // Transform Node.js response to match frontend expectations
        const formattedUncategorizedTransactions: FormattedTransaction[] = uncategorizedTransactions.map((tx: any) => ({
            transaction_id: tx.transaction_id,
            payee_name: tx.payee_name,
            amount: tx.amount,
            date: tx.date,
            suggested_category_name: tx.ai_suggested_category || null,
            loading_suggestion: !tx.ai_suggested_category, // Need to load if no cached suggestion
            cached: !!tx.ai_suggested_category
        }));

        const cachedCount = formattedUncategorizedTransactions.filter((tx: FormattedTransaction) => tx.cached).length;

        console.log(`🏦 Loaded transactions page with ${formattedUncategorizedTransactions.length} uncategorized and ${unapprovedTransactions.length} unapproved transactions`);
        console.log(`💾 ${cachedCount} cached suggestions available`);

        return (
            <TransactionsPageWithTabs
                budgetUuid={budgetUuid}
                categories={categories}
                uncategorizedTransactions={formattedUncategorizedTransactions}
                unapprovedTransactions={unapprovedTransactions}
            />
        );
    } catch (error) {
        console.error('Error loading transactions:', error);
        return (
            <div className="p-4">
                <h2 className="text-xl font-bold mb-4 text-red-600">Error Loading Transactions</h2>
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
