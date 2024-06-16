import "server-only";

import { LocalCategory, LocalCategoryType } from "./category.schema";
import { Budget, Category, Transaction } from "common-ts";
import mongoose from "mongoose";
import connectDb from "../db";
import { getBudget } from "../budget/budget.server";
import { UserType } from "../user/user.server";

export const getCategories = async (
  budgetUuid: string,
  user: UserType
): Promise<Category[]> => {
  const budget = await getBudget(budgetUuid, user);
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

export const deleteCategory = async (uuid: string) => {
  connectDb();
  await LocalCategory.deleteOne({ uuid }).exec();
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
  connectDb();
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
  connectDb();
  await LocalCategory.updateOne(
    { _id: category._id },
    {
      name: category.name,
      balance: category.balance,
      budgeted: category.budgeted,
      activity: category.activity,
      targetAmount: category.targetAmount,
    }
  ).exec();
};
