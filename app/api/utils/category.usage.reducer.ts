import { CategoryUsage } from "../category/category.utils";
import { Transaction } from "../transaction/transaction.utils";

export const categoryUsageReducer = (
  categoryUsages: CategoryUsage[],
  transaction: Transaction
) => {
  const categoryUsage = categoryUsages.find(
    (usage: CategoryUsage) => usage.name === transaction.categoryName
  );
  if (categoryUsage) {
    categoryUsage.amount += transaction.amount;
    categoryUsage.transactions.push(transaction);
  } else {
    categoryUsages.push({
      name: transaction.categoryName,
      amount: transaction.amount,
      uuid: transaction.categoryId,
      transactions: [transaction],
    });
  }
  return categoryUsages;
};
