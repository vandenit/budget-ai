import {
  LocalCategory,
  LocalCategoryHistory,
  LocalCategoryType,
} from "./category.schema";
import { Category, CategoryData, Transaction } from "common-ts";
import connectDb from "../db";
import { CategoryHistoryReducer } from "../utils/category.history.reducer";

export type CategoryHistory = {
  categoryName: string;
  categoryUuid: string;
  categoryId: string;
  month: string;
  activity: number;
  budgetId: string;
};

export type CategoryHistoryForInsert = {
  categoryId: string;
  activity: number;
  month: string;
  budgetId: string;
};

export const findCategories = async (budgetId: string): Promise<Category[]> => {
  const localCategories = await LocalCategory.find({ budgetId });
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
  historicalAverage: localCategory.historicalAverage,
  typicalSpendingPattern: localCategory.typicalSpendingPattern,
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
    historicalAverage: category.historicalAverage,
    typicalSpendingPattern: category.typicalSpendingPattern,
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

export const getCategoryHistory = async (
  budgetId: string,
  $expr: any
): Promise<CategoryHistory[]> => {
  try {
    const result = await LocalCategory.aggregate([
      {
        $match: {
          budgetId,
        },
      },
      {
        $lookup: {
          from: "categoryhistories", // The collection name for CategoryHistory
          let: { categoryId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr,
              },
            },
          ],
          as: "categoryInfo",
        },
      },
      {
        $unwind: {
          path: "$categoryInfo",
          preserveNullAndEmptyArrays: true, // Set to true if you want categories without history as well
        },
      },
      {
        $project: {
          categoryName: "$name",
          categoryUuid: "$uuid",
          categoryId: "$_id",
          month: "$categoryInfo.month",
          activity: "$categoryInfo.activity",
        },
      },
    ]);

    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getCategoryHistoryForBudget = async (
  budgetId: string
): Promise<CategoryHistory[]> =>
  getCategoryHistory(budgetId, {
    $eq: ["$categoryId", "$$categoryId"],
  });

export const getCategoryHistoryForMonth = async (
  month: string,
  budgetId: string
): Promise<CategoryHistory[]> =>
  getCategoryHistory(budgetId, {
    $and: [
      { $eq: ["$categoryId", "$$categoryId"] },
      { $eq: ["$month", month] },
    ],
  });

export const saveSpendingData = async (categoryData: CategoryData[]) => {
  try {
    // bulk update category data
    // for each category save spending data
    const operations = categoryData.map((data) => {
      return {
        updateOne: {
          filter: { _id: data.categoryId },
          update: {
            $set: {
              historicalAverage: data.historicalAverage,
              typicalSpendingPattern: data.typicalSpendingPattern,
            },
          },
        },
      };
    });
    if (operations.length > 0) {
      console.log(`bulk updating ${operations.length} categories`);

      await LocalCategory.bulkWrite(operations);
    }
  } catch (error) {
    console.log("Error saving spending data", error);
    throw new Error("Error saving spending data");
  }
};

export const clearCategoryHistoryForYear = async (
  budgetId: string,
  yearString: string
) => {
  console.log(
    `deleting category history for ${yearString} and budgetId ${budgetId}`
  );
  await LocalCategoryHistory.deleteMany({
    budgetId,
    month: { $regex: `^${yearString}-` },
  }).exec();
};

export const populateCategoryHistoryFromTransactions = async (
  budgetId: string,
  transactions: Transaction[],
  year: string
) => {
  const categoryHistoryForInsert: CategoryHistoryForInsert[] = transactions
    .filter((transaction) => transaction.categoryId)
    .reduce(CategoryHistoryReducer(budgetId), []);
  console.log(
    `inserting ${categoryHistoryForInsert.length} category histories for ${year}
    and budgetId ${budgetId}`
  );
  await LocalCategoryHistory.insertMany(categoryHistoryForInsert);
};
