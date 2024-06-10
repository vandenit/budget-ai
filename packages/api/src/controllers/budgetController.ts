import { findBudgets } from "../data/budget/budget.server";
import { getUserByAuthId } from "../data/user/user.server";
import { Request, Response } from "express";
import { getUserFromReq } from "./utils";

export const findBudgetsForUser = async (req: Request, res: Response) => {
  // get user from database
  const user = await getUserFromReq(req);
  if (!user) {
    console.error("no user found");
    // res.status(401).send("Unauthorized");
    return res.json([]);
  }
  // get budgets for user
  const budgets = await findBudgets(user);
  res.json(budgets);
};
