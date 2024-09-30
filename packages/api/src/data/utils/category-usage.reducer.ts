import { Category, Transaction } from "common-ts";

export const categoryUsageReducer =
  (categoriesFromDb: Category[]) =>
  (categories: Category[], transaction: Transaction) => {
    const categoryFromDb = categoriesFromDb.find(
      (category: Category) => `${category._id}` === `${transaction.categoryId}`
    );
    if (!categoryFromDb) {
      return categories;
    }
    const categoryUsage = categories.find(
      (usage: Category) => `${usage._id}` === `${transaction.categoryId}`
    );
    if (categoryUsage) {
      categoryUsage.activity += transaction.amount;
    } else {
      categories.push({
        ...categoryFromDb,
        activity: transaction.amount,
      });
    }
    return categories;
  };
