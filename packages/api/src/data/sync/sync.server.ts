import "server-only";
import {
  UserType,
  findNonSyncedUsers,
  updateSyncDate,
} from "../user/user.server";
import { syncYnabUser } from "../ynab/ynab.server";

export const syncBudgetData = async (): Promise<number> => {
  const users = await findNonSyncedUsers();
  users.forEach(syncUser);
  console.log(`syncing data for ${users.length} users`);
  return users.length;
};

export const syncUser = async (user: UserType) => {
  try {
    if (user.ynab?.connection) {
      await syncYnabUser(user);
    }
    await updateSyncDate(user, new Date());
  } catch (exception) {
    console.warn("error syncing user with id:" + user.authId, exception);
  }
};
