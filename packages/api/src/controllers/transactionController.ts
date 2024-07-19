import { Request, Response } from "express";
import { Category, Transaction } from "common-ts";
import { getFilteredTransactions } from "../data/main.budget.server";
import { getUserFromReq } from "./utils";
import { getBudget } from "../data/budget/budget.server";
import { findCategories } from "../data/category/category.server";

const inTransactions = (transactions: Transaction[]) => (category: Category) =>
  transactions.some((t) => t.categoryId === category._id);

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
  const categories = (await findCategories(budget._id)).filter(
    inTransactions(transactions)
  );
  res.json({ transactions, categories });
};
