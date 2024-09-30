import { Request, Response } from "express";
import { Category, Transaction } from "common-ts";
import { getFilteredTransactions } from "../data/main.budget.server";
import { getUserFromReq } from "./utils";
import { getBudget } from "../data/budget/budget.server";
import { findCategories } from "../data/category/category.server";
import { categoryUsageReducer } from "../data/utils/category-usage.reducer";

const inTransactions = (transactions: Transaction[]) => (category: Category) =>
  transactions.some((t) => `${t.categoryId}` === `${category._id}`);

const noTransfersFilter = (t: Transaction) => t.categoryId !== undefined;

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
  const dbTransactions = await getFilteredTransactions(
    budget._id,
    month?.toString(),
    dayOfMonth?.toString()
  );
  const transactions = dbTransactions.filter(noTransfersFilter);
  const categoriesFromDb = (await findCategories(budget._id)).filter(
    inTransactions(transactions)
  );
  // todo populate categories from transactions to have real usage
  const categories = transactions.reduce(
    categoryUsageReducer(categoriesFromDb),
    []
  );

  res.json({ transactions, categories });
};
