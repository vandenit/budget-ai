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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 rounded-xl border border-slate-200 dark:border-slate-700">
            {/* Total */}
            <div className="text-center">
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Total
                </div>
                <div className="text-2xl font-bold">
                    <TransactionAmount amount={total} />
                </div>
            </div>

            {/* Inflow */}
            <div className="text-center">
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Inflow
                </div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    <TransactionAmount amount={totalInflow} />
                </div>
            </div>

            {/* Outflow */}
            <div className="text-center">
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Outflow
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    <TransactionAmount amount={Math.abs(totalOutflow)} />
                </div>
            </div>
        </div>
    );
}
