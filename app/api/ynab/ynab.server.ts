import { update } from "ramda";
import * as ynab from "ynab";
import {
  findBudgets,
  getBudget,
  saveNewBudget,
  updateBudget,
} from "../budget/budget.server";
import { UserType } from "../user/user.server";
import * as ynabApi from "./ynab-api"; // Import the missing ynapApi module
import {
  getCategory,
  saveNewCategory,
  updateCategory,
} from "../category/category.server";
import { Budget } from "../budget/budget.utils";

const syncBudgets = async (user: UserType) => {
  const ynabBudgets = await ynabApi.getBudgets(user); // Use the imported ynapApi module
  ynabBudgets.forEach(async (ynabBudget) => {
    console.log(
      `syncing budget with id: ${ynabBudget.id} and name: ${ynabBudget.name}`
    );
    const localBudget = await getBudget(ynabBudget.id);
    if (!localBudget) {
      await saveNewBudget(
        {
          uuid: ynabBudget.id,
          name: ynabBudget.name,
        },
        user
      );
    } else {
      await updateBudget(ynabBudget.id, ynabBudget.name, user);
    }
  });
};

const syncCategories = async (user: UserType) => {
  const budgets = await findBudgets(user);
  budgets.forEach(async (budget) => {
    const ynabCategories = await ynabApi.getCategories(budget.uuid, user);
    ynabCategories.forEach(async (ynabCategory) => {
      const localCategory = await getCategory(ynabCategory.id);
      if (!localCategory) {
        await saveNewCategory(mapCategory(ynabCategory, budget));
      } else {
        await updateCategory(mapCategory(ynabCategory, budget));
      }
    });
  });
};

const mapCategory = (ynabCategory: ynab.Category, budget: Budget) => ({
  uuid: ynabCategory.id,
  name: ynabCategory.name,
  budgetId: budget._id || "",
  balance: ynabCategory.balance,
  targetAmount: ynabCategory.goal_target || 0,
  budgeted: ynabCategory.budgeted,
  activity: ynabCategory.activity,
});

export const syncYnabUser = async (user: UserType) => {
  console.log(`syncing Ynab data for user with id: ${user.authId}`);
  await ynabApi.refreshUserToken(user);

  await syncBudgets(user);
  await syncCategories(user);
};
