import { connect } from "http2";
import User from "./user.schema";
import connectDb from "../db";
import { getSession } from "@auth0/nextjs-auth0";
import mongoose from "mongoose";

type YnabConnection = {
  accessToken: string;
  refreshToken: string;
};

type User = {
  _id: mongoose.Schema.Types.ObjectId;
  authId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  ynabConnection: YnabConnection;
  settings: {
    preferredBudgetId: string;
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

export const connectUserWithYnab = async (ynabConnection: YnabConnection) => {
  await connectDb();
  console.log(`connecting user with ynab: ${JSON.stringify(ynabConnection)}`);
  const authId = await getLoggedInUserAuthId();
  if (!authId) {
    return;
  }
  await User.updateOne({ authId }, { ynabConnection, updatedAt: new Date() });
};

export const getUserByAuthId = async (
  authId: string
): Promise<User | null | undefined> => {
  await connectDb();
  return User.findOne({ authId });
};

export const savePreferredBudget = async (budgetId: string) => {
  await connectDb();
  const authId = await getLoggedInUserAuthId();
  console.log(`saving preferred budget ${budgetId} for ${authId}`);
  if (!authId) {
    return;
  }
  const user = await getUserByAuthId(authId);
  if (!user) {
    throw new Error("User not found");
  }
  await User.updateOne({ authId }, { "settings.preferredBudgetId": budgetId });
};

export const getLoggedInUserPreferredBudgetId = async () => {
  const user = await getLoggedInUser();
  if (!user) {
    return;
  }
  return user?.settings?.preferredBudgetId || "";
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
