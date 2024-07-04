import { Request, Response } from "express";
import { Transaction } from "common-ts";
import {
  getCategoriesFromTransactions,
  getFilteredTransactions,
} from "../data/main.budget.server";
import { getUserFromReq } from "./utils";
import { getBudget } from "../data/budget/budget.server";

export const getFilteredTransactionsWithCategories = async (
  req: Request,
  res: Response
) => {
  // get user from database
  const user = await getUserFromReq(req);
  if (!user) {
    console.error("no user found");
    return res.status(401).send("Unauthorized");
  }
  const budgetUuid = req.params.uuid;
  // print all req.params
  //print all query
  const { month, dayOfMonth } = req.query;
  const budget = await getBudget(budgetUuid, user);
  if (!budget) {
    console.error(`budget ${budgetUuid} does not belong to user`);
    return res.status(401).send("Unauthorized");
  }
  const transactions = await getFilteredTransactions(
    budget._id,
    month?.toString(),
    dayOfMonth?.toString()
  );
  const categories = await getCategoriesFromTransactions(
    budget._id,
    transactions,
    user
  );
  res.json({ transactions, categories });
};
