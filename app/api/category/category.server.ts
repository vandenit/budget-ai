import "server-only";

import { Transaction } from "../transaction/transaction.utils";
import { LocalCategory, LocalCategoryType } from "./category.schema";
import { Budget } from "../budget/budget.utils";
import mongoose from "mongoose";
import { Category } from "./category.utils";
import { getBudget } from "../main.budget.server";

export const getCategories = async (
  budgetUuid: string
): Promise<Category[]> => {
  const budget = await getBudget(budgetUuid);
  if (!budget) {
    return [];
  }
  const localCategories = await LocalCategory.find({ budgetId: budget._id });
  return localCategories.map(mapLocalCategory);
};

export const getCategory = async (uuid: string): Promise<Category | null> => {
  const localCategory = await LocalCategory.findOne({ uuid });
  if (!localCategory) {
    return null;
  }
  return mapLocalCategory(localCategory);
};

const mapLocalCategory = (localCategory: LocalCategoryType): Category => ({
  _id: `${localCategory._id}`,
  name: localCategory.name,
  uuid: localCategory.uuid,
  balance: localCategory.balance,
  budgeted: localCategory.budgeted,
  activity: localCategory.activity,
  targetAmount: localCategory.targetAmount,
  budgetId: `${localCategory.budgetId}`,
});

export const saveNewCategory = async (category: Category) => {
  console.log("saving new category:" + JSON.stringify(category));
  const localCategory = new LocalCategory({
    uuid: category.uuid,
    name: category.name,
    balance: category.balance,
    budgeted: category.budgeted,
    activity: category.activity,
    targetAmount: category.targetAmount,
    budgetId: category.budgetId,
  });
  await localCategory.save();
};

export const updateCategory = async (category: Category) => {
  console.log("updateCategory category:" + JSON.stringify(category));
  await LocalCategory.updateOne(
    { _id: category._id },
    {
      name: category.name,
      balance: category.balance,
      budgeted: category.budgeted,
      activity: category.activity,
      targetAmount: category.targetAmount,
    }
  );
};
