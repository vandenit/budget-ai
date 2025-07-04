import connectDb from "../db";
import { LocalAccount, LocalAccountType } from "./account.schema";

export const getAccount = async (
  uuid: string
): Promise<LocalAccountType | null> => {
  const localAccount = await LocalAccount.findOne({ uuid });
  return localAccount;
};

export const findAccounts = async (
  budgetId: string
): Promise<LocalAccountType[]> => {
  await connectDb();
  const accounts = await LocalAccount.find({ budgetId }).exec();
  return accounts;
};

export const saveNewAccount = async (account: LocalAccountType) => {
  connectDb();
  const localAccount = new LocalAccount({
    uuid: account.uuid,
    name: account.name,
    balance: account.balance,
    cleared_balance: account.cleared_balance,
    uncleared_balance: account.uncleared_balance,
    budgetId: account.budgetId,
  });
  await localAccount.save();
};

export const updateAccount = async (account: LocalAccountType) => {
  connectDb();
  await LocalAccount.updateOne(
    { _id: account._id },
    {
      name: account.name,
      balance: account.balance,
      cleared_balance: account.cleared_balance,
      uncleared_balance: account.uncleared_balance,
    }
  ).exec();
};

export const deleteAccount = async (uuid: string) => {
  connectDb();
  await LocalAccount.deleteOne({ uuid }).exec();
};
