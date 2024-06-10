import "server-only";
import User from "./user.schema";
import connectDb from "../db";
import mongoose from "mongoose";
import { getSession } from "@auth0/nextjs-auth0";

const MAX_SYNC_USERS = 100;
const SYNC_INTERVAL_MINUTES = 0;

type YnabConnection = {
  accessToken: string;
  refreshToken: string;
};

type YnabUserData = {
  connection: YnabConnection;
};

export type UserType = {
  _id: mongoose.Schema.Types.ObjectId;
  authId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  syncDate?: Date;
  ynab?: YnabUserData;
  settings: {
    preferredBudgetUuid: string;
  };
};

const getLoggedInUserAuthId = async (): Promise<string> => {
  try {
    const session = await getSession();
    return session?.user?.sub || "";
  } catch (exception) {
    return "";
  }
};

export const createOrUpdateUser = async ({
  authId,
  name,
}: {
  authId: string;
  name: string;
}) => {
  console.log("createOrUpdateUser with id:" + authId + " and name:" + name);
  await connectDb();
  const user = await getUserByAuthId(authId);
  if (user) {
    user.updatedAt = new Date();
    user.name = name;
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

export const updateUserServerKnowledge = async ({
  user,
  budgetUuid,
  systemType,
  type,
  knowledge,
}: {
  user: UserType;
  budgetUuid: string;
  systemType: "ynab";
  type: "transactions" | "categories";
  knowledge: number;
}) => {
  await connectDb();
  const key = `${systemType}.serverKnowledge.${budgetUuid}.${type}`;
  console.log("update knownloedge:" + `${key}` + ",with: " + knowledge);
  await User.updateOne({ _id: user._id }, { [key]: knowledge });
};

export const connectUserWithYnab = async (
  connection: YnabConnection,
  user?: UserType
) => {
  await connectDb();
  console.log(`connecting user with ynab: ${JSON.stringify(connection)}`);
  const finalUser = user || (await getLoggedInUser());
  const authId = finalUser?.authId;
  if (!authId) {
    return;
  }
  await User.updateOne(
    { authId },
    { ynab: { connection }, updatedAt: new Date() }
  );
};

export const getUserByAuthId = async (
  authId: string
): Promise<UserType | null | undefined> => {
  await connectDb();
  return User.findOne({ authId });
};

export const savePreferredBudget = async (budgetUuid: string) => {
  await connectDb();
  const authId = await getLoggedInUserAuthId();
  console.log(`saving preferred budget ${budgetUuid} for ${authId}`);
  if (!authId) {
    return;
  }
  const user = await getUserByAuthId(authId);
  if (!user) {
    throw new Error("User not found");
  }
  await User.updateOne(
    { authId },
    { "settings.preferredBudgetUuid": budgetUuid }
  );
};

export const getLoggedInUserPreferredBudgetId = async () => {
  const user = await getLoggedInUser();
  if (!user) {
    return;
  }
  return user?.settings?.preferredBudgetUuid || "";
};

export const getLoggedInUser = async () => {
  await connectDb();
  const authId = await getLoggedInUserAuthId();
  if (!authId) {
    return;
  }
  const user = await getUserByAuthId(authId);
  if (!user) {
    return;
  }
  return user;
};

const xMinutesAgo = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - SYNC_INTERVAL_MINUTES);
  return date;
};

export const findNonSyncedUsers = async (): Promise<UserType[]> => {
  connectDb();
  // find last MAX_SYNC_USERS users with no sync date or sync date older than 5 minutes
  return User.find({
    $or: [
      { syncDate: { $exists: false } },
      { syncDate: { $lt: xMinutesAgo() } },
    ],
  })
    .sort({ updatedAt: -1 })
    .limit(MAX_SYNC_USERS);
};

export const updateSyncDate = async (user: UserType, date: Date) => {
  connectDb();
  User.updateOne({ _id: user._id }, { syncDate: date }).exec();
};

export const clearYnabConnection = async (user: UserType) => {
  connectDb();
  await User.updateOne({ _id: user._id }, { ynab: undefined });
};
