import { groupByDateGeneric } from "./utils";
import { Category, Transaction } from "common-ts";
import { TransactionCard, BaseTransaction } from "./transaction-card";
import { TransactionDateGroup } from "./transaction-date-group";

// Create a compatible transaction type for the card component
interface TransactionForCard extends BaseTransaction {
  uuid: string;
  categoryId: string | undefined | null;
  payeeName: string;
}

export const TransactionList = ({
  transactions,
  categories
}: {
  transactions: Transaction[];
  categories: Category[];
}) => {
  const getCategoryName = (categoryId: string | undefined | null, categories: Category[]) => {
    const category = categories.find((category) => category._id === categoryId);
    return category ? category.name : "Uncategorized";
  };

  // Convert transactions to format compatible with TransactionCard
  const transactionsForCard: TransactionForCard[] = transactions.map(transaction => ({
    uuid: transaction.uuid,
    amount: transaction.amount,
    payee_name: transaction.payeeName,
    payeeName: transaction.payeeName,
    date: transaction.date,
    memo: transaction.memo,
    categoryId: transaction.categoryId
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
          {dayTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.uuid}
              transaction={transaction}
              categoryName={getCategoryName(transaction.categoryId, categories)}
              showCategory={true}
              showActions={false}
              showMemo={true}
              variant={transaction.categoryId ? 'default' : 'attention'}
            />
          ))}
        </TransactionDateGroup>
      ))}
    </div>
  );
};
