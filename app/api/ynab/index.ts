import { UserType } from "../user/user.server";
import { getBudgets, refreshUserToken } from "./ynab-api";

const syncBudgets = async (user: UserType) => {
  const ynabBudgets = await getBudgets(user);
  console.log("found budgets:" + JSON.stringify(ynabBudgets));
};
export const syncYnabUser = async (user: UserType) => {
  console.log(`syncing Ynab data for user with id: ${user.authId}`);
  await refreshUserToken(user);

  await syncBudgets(user);
};
