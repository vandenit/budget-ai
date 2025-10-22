import {
  UserType,
  findNonSyncedUsers,
  updateSyncDate,
  getUserByAuthId,
} from "../user/user.server";
import { syncYnabUser } from "../ynab/ynab.server";
import { ensureUserEncryptionKey } from "../encryption/encryption.server";

export const syncBudgetData = async (): Promise<number> => {
  const users = await findNonSyncedUsers();
  users.forEach(syncUser);
  console.log(`syncing data for ${users.length} users`);
  return users.length;
};

export const syncUser = async (user: UserType) => {
  try {
    if (user.ynab?.connection) {
      // Ensure user has encryption key before syncing
      const userWithEncryption = await ensureUserEncryptionKey(user);
      if (!userWithEncryption.encryption?.publicKey) {
        console.warn(
          `Skipping sync for user ${user.authId}: encryption key generation failed`
        );
        return;
      }
      await syncYnabUser(userWithEncryption);
    }
    await updateSyncDate(user, new Date());
  } catch (exception) {
    console.warn("error syncing user with id:" + user.authId, exception);
  }
};
