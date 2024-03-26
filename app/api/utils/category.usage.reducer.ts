import { CategoryUsage } from "../budget.server";
import { Transaction } from "../transaction/transaction.server";

export const categoryUsageReducer = (categoryUsages: CategoryUsage[], transaction: Transaction) => {
    const categoryUsage = categoryUsages.find((usage: CategoryUsage) => usage.categoryName === transaction.categoryName);
    if (categoryUsage) {
        categoryUsage.amount += transaction.amount;
        categoryUsage.transactions.push(transaction);
    } else {
        categoryUsages.push({
            categoryName: transaction.categoryName,
            amount: transaction.amount,
            categoryId: transaction.categoryId,
            transactions: [transaction],
        });
    }
    return categoryUsages;
};