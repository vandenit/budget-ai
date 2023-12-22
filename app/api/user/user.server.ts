import { connect } from "http2";
import { getLoggedInUserAuthId } from "../ynab-api";
import User from "./user.schema";
import connectDb from "../db";

export const createOrUpdateUser = async (token?: string) => {
  console.log("createOrUpdateUser with token:" + token);
  await connectDb();
  const authId = await getLoggedInUserAuthId(token);
  if (!authId) {
    return;
  }
  const user = await User.findOne({ authId });
  if (user) {
    user.updatedAt = new Date();
    return user;
  }
  const newUser = new User({
    authId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await newUser.save();
  return newUser;
};

export const getUserByAuthId = async (authId: string) => {
  return User.findOne({ authId });
};

export const savePreferredBudget = async (
  budgetId: string,
  secondAttempt?: boolean
) => {
  await connectDb();
  const authId = await getLoggedInUserAuthId();
  console.log(`saving preferred budget ${budgetId} for ${authId}`);
  if (!authId) {
    return;
  }
  const user = await getUserByAuthId(authId);
  if (!user) {
    if (secondAttempt) {
      console.warn("user not found after second attempt: aborting");
      return;
    }
    await createOrUpdateUser();
    await savePreferredBudget(budgetId, true);
    return;
  }
  await User.updateOne({ authId }, { "settings.preferredBudgetId": budgetId });
};

export const getLoggedInUserPreferredBudgetId = async () => {
  await connectDb();
  const authId = await getLoggedInUserAuthId();
  if (!authId) {
    return;
  }
  const user = await getUserByAuthId(authId);
  if (!user) {
    return;
  }
  return user?.settings?.preferredBudgetId || "";
};
