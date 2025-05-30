import { groupByDateGeneric } from "./utils";
import { Category, Transaction } from "common-ts";
import { TransactionCard, BaseTransaction } from "./transaction-card";
import { TransactionDateGroup } from "./transaction-date-group";
import { useCategoryUpdate } from "../../hooks/use-category-update";
import { useState } from "react";

// Create a compatible transaction type for the card component
interface TransactionForCard extends BaseTransaction {
  uuid: string;
  categoryId: string | undefined | null;
  payeeName: string;
}

export const TransactionList = ({
  transactions,
  categories,
  budgetUuid,
  enableCategoryEdit = false
}: {
  transactions: Transaction[];
  categories: Category[];
  budgetUuid?: string;
  enableCategoryEdit?: boolean;
}) => {
  const [updatedTransactions, setUpdatedTransactions] = useState<Transaction[]>(transactions);

  const { updateCategory, isUpdatingTransaction } = useCategoryUpdate({
    budgetId: budgetUuid || '',
    onSuccess: (transactionId, categoryName) => {
      // Update the local state to reflect the category change
      setUpdatedTransactions(prev =>
        prev.map(t =>
          (t.uuid === transactionId)
            ? { ...t, categoryId: categories.find(c => c.name === categoryName)?._id || null }
            : t
        )
      );
    },
    onError: (error) => {
      console.error('Failed to update category:', error);
      // You could add toast notification here
    }
  });
  const getCategoryName = (categoryId: string | undefined | null, categories: Category[]) => {
    const category = categories.find((category) => category._id === categoryId);
    return category ? category.name : "Uncategorized";
  };

  const handleCategoryChange = async (transactionId: string, categoryId: string, categoryName: string) => {
    if (!budgetUuid) return;
    await updateCategory(transactionId, categoryId, categoryName, true);
  };

  // Use updated transactions for display
  const transactionsToDisplay = updatedTransactions.length > 0 ? updatedTransactions : transactions;

  // Convert transactions to format compatible with TransactionCard
  const transactionsForCard: TransactionForCard[] = transactionsToDisplay.map(transaction => ({
    uuid: transaction.uuid,
    amount: transaction.amount,
    payee_name: transaction.payeeName,
    payeeName: transaction.payeeName,
    date: transaction.date,
    memo: transaction.memo,
    categoryId: transaction.categoryId,
    id: transaction.uuid // Add id field for compatibility
  }));

  const groupedTransactions = groupByDateGeneric(transactionsForCard);

  return (
    <div className="space-y-4">
      {Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
        <TransactionDateGroup
          key={date}
          date={date}
          transactions={dayTransactions}
          defaultOpen={true}
          showTotals={true}
          showTransactionCount={true}
        >
          {dayTransactions.map((transaction) => {
            const categoryName = getCategoryName(transaction.categoryId, categories);
            const categoryId = transaction.categoryId || undefined;
            const isUpdating = isUpdatingTransaction(transaction.uuid);

            return (
              <TransactionCard
                key={transaction.uuid}
                transaction={transaction}
                categoryName={categoryName}
                categoryId={categoryId}
                categories={categories}
                enableCategoryEdit={enableCategoryEdit && !!budgetUuid}
                onCategoryChange={handleCategoryChange}
                showCategory={true}
                showActions={false}
                showMemo={true}
                isEditing={isUpdating}
                variant={transaction.categoryId ? 'default' : 'attention'}
              />
            );
          })}
        </TransactionDateGroup>
      ))}
    </div>
  );
};
