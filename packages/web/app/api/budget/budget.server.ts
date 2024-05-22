import "server-only";
import { UserType, getLoggedInUser } from "../user/user.server";
import { LocalBudget } from "./budget.schema";
import { Budget } from "./budget.utils";

export const findBudgets = async (userInput?: UserType): Promise<Budget[]> => {
  const user = userInput || (await getLoggedInUser());
  if (!user) {
    throw new Error("no user given or logged in");
  }
  const localBudgets = await LocalBudget.find({ users: user._id });
  return localBudgets.map((localBudget) => ({
    _id: localBudget._id,
    uuid: localBudget.uuid,
    name: localBudget.name,
  }));
};

const mapLocalBudget = (localBudget: any): Budget => ({
  _id: localBudget._id,
  uuid: localBudget.uuid,
  name: localBudget.name,
});

export const getBudgetWithoutUserCheck = async (
  uuid: string
): Promise<Budget | null> => {
  const localBudget = await LocalBudget.findOne({ uuid });
  if (!localBudget) {
    return null;
  }
  return mapLocalBudget(localBudget);
};

export const getBudget = async (
  uuid: string,
  user: UserType
): Promise<Budget | null> => {
  const localBudget = await LocalBudget.findOne({ uuid, users: user._id });
  if (!localBudget) {
    return null;
  }
  return mapLocalBudget(localBudget);
};

export const saveNewBudget = async (
  budget: Budget,
  user: UserType
): Promise<void> => {
  const localBudget = new LocalBudget({
    users: [user._id],
    uuid: budget.uuid,
    name: budget.name,
  });
  console.log("saving new budget: " + JSON.stringify(localBudget));
  await localBudget.save();
};

export const updateBudget = async (
  uuid: string,
  name: string,
  userInput: UserType
): Promise<void> => {
  // update name and add users to budget users array
  await LocalBudget.updateOne(
    { uuid },
    { name, $addToSet: { users: userInput._id } }
  );
};
