import { Transaction } from "common-ts";
import { TransactionAmount } from "./transaction-amount";

export const TransactionTotals = ({
    transactions,
}: {
    transactions: Transaction[];
}) => {
    const total = transactions.reduce((acc, transaction) => acc + transaction.amount, 0);
    const totalInflow = transactions.reduce((acc, transaction) => transaction.amount > 0 ? acc + transaction.amount : acc, 0);
    const totalOutflow = transactions.reduce((acc, transaction) => transaction.amount < 0 ? acc + transaction.amount : acc, 0);
    return (
        <div className="flex justify-between">
            <div className="text-lg">Total: <TransactionAmount amount={total} /></div>
            <div className="text-lg">Inflow: <TransactionAmount amount={totalInflow} /></div>
            <div className="text-lg">Outflow: <TransactionAmount amount={totalOutflow} /></div>
        </div>
    );
}
