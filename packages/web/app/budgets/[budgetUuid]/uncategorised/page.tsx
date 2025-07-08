import { Suspense } from 'react';
import { getCategories } from '../../../api/categories.client';
import BudgetSubNavigation from '../../../components/budget-sub-navigation';
import Loading from '../../../components/Loading';
import TransactionsDataSection from './TransactionsDataSection';

interface PageProps {
    params: {
        budgetUuid: string;
    };
}

export default async function UncategorisedTransactionsPage({ params }: PageProps) {
    const budgetUuid = params.budgetUuid;

    // Fetch categories immediately (fast operation)
    const categories = await getCategories(budgetUuid);

    return (
        <>
            <BudgetSubNavigation budgetUuid={budgetUuid} />
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-6 dark:text-white">Transactions</h1>

                <Suspense fallback={<Loading />}>
                    <TransactionsDataSection
                        budgetUuid={budgetUuid}
                        categories={categories}
                    />
                </Suspense>
            </div>
        </>
    );
}