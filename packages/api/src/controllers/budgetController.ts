import { findBudgets, getBudget } from "../data/budget/budget.server";
import { getBudgetOverviewForUser } from "../data/main.budget.server";
import { Request, Response } from "express";
import { getUserFromReq } from "./utils";
import { Budget } from "common-ts";
import * as ynabService from "../data/ynab/ynab.server";

export const getBudgetFromReq = async (req: Request): Promise<Budget> => {
  const user = await getUserFromReq(req);
  if (!user) {
    throw new Error("no user found");
  }
  const budget = await getBudget(req.params.uuid, user);
  if (!budget) {
    throw new Error(`budget ${req.params.uuid} does not belong to user`);
  } 
 
  return budget;
};

export const findBudgetsForUser = async (req: Request, res: Response) => {
  // get user from database
  const user = await getUserFromReq(req);
  if (!user) {
    console.error("no user found");
    return res.status(401).send("Unauthorized");
  }
  // get budgets for user
  const budgets = await findBudgets(user);
  res.json(budgets);
};

export const getBudgetForUser = async (req: Request, res: Response) => {
  const budget = await getBudgetFromReq(req);
  res.json(budget);
};

export const handleGetBudgetOverviewForUser = async (
  req: Request,
  res: Response
) => {
  const budget = await getBudgetFromReq(req);
  // get budget overview for user
  const budgetOverview = await getBudgetOverviewForUser(budget._id);
  res.json(budgetOverview);
};

export const getAccountsForBudget = async (req: Request, res: Response) => {
  const user = await getUserFromReq(req);
  if (!user) {
    throw new Error("no user found");
  }

  const budget = await getBudget(req.params.uuid, user);
  if (!budget) {
    throw new Error(`budget ${req.params.uuid} does not belong to user`);
  }

  const accounts = await ynabService.getAccounts(user, budget.uuid);
  res.json(accounts);
};
