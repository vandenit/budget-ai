import { Request, Response } from "express";
import * as ynabService from "../data/ynab/ynab.server";
import { UserType } from "../data/user/user.server";
import { getBudgetFromReq } from "./budgetController";
import { getUserFromReq } from "./utils";
import { getBudget } from "../data/budget/budget.server";

type RequestWithUser = Request & { user: UserType };

/**
 * Get scheduled transactions for a budget
 */
export const getScheduledTransactions = async (req: Request, res: Response) => {
  const user = await getUserFromReq(req);
  if (!user) {
    throw new Error("no user found");
  }

  const budget = await getBudget(req.params.uuid, user);
  if (!budget) {
    throw new Error(`budget ${req.params.uuid} does not belong to user`);
  }

  const scheduledTransactions = await ynabService.getScheduledTransactions(
    user,
    budget.uuid
  );

  res.json(scheduledTransactions);
};

export const create = async (req: Request, res: Response) => {
  const user = await getUserFromReq(req);
  if (!user) {
    throw new Error("no user found");
  }

  const budget = await getBudget(req.params.uuid, user);
  if (!budget) {
    throw new Error(`budget ${req.params.uuid} does not belong to user`);
  }

  const { amount, categoryId, date, payeeName, memo, accountId } = req.body;

  // Validate required fields
  if (!amount || !categoryId || !date || !accountId) {
    throw new Error("Missing required fields: amount, categoryId, date, accountId");
  }

  // Validate data types and formats
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error("Amount must be a valid number");
  }

  if (typeof categoryId !== 'string' || categoryId.trim().length === 0) {
    throw new Error("Category ID must be a non-empty string");
  }

  if (typeof accountId !== 'string' || accountId.trim().length === 0) {
    throw new Error("Account ID must be a non-empty string");
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw new Error("Date must be in YYYY-MM-DD format");
  }

  // Validate optional fields
  if (payeeName && typeof payeeName !== 'string') {
    throw new Error("Payee name must be a string");
  }

  if (memo && typeof memo !== 'string') {
    throw new Error("Memo must be a string");
  }

  // Sanitize string inputs
  const sanitizedData = {
    amount: Number(amount),
    categoryId: categoryId.trim(),
    date: date.trim(),
    payeeName: payeeName ? payeeName.trim() : undefined,
    memo: memo ? memo.trim() : undefined,
    accountId: accountId.trim()
  };

  const result = await ynabService.createScheduledTransaction(
    user,
    budget.uuid,
    sanitizedData
  );

  res.status(201).json(result);
};

export const update = async (req: Request, res: Response) => {
  const { transactionId } = req.params;
  const updates = req.body;
  const user = await getUserFromReq(req);
  if (!user) {
    throw new Error("no user found");
  }
  const budget = await getBudget(req.params.uuid, user);
  if (!budget) {
    throw new Error(`budget ${req.params.uuid} does not belong to user`);
  }

  const result = await ynabService.updateScheduledTransaction(
    user,
    budget.uuid,
    transactionId,
    updates
  );
  res.json(result);
};

export const remove = async (req: RequestWithUser, res: Response) => {
  const { transactionId } = req.params;

  const user = await getUserFromReq(req);
  if (!user) {
    throw new Error("no user found");
  }
  const budget = await getBudget(req.params.uuid, user);
  if (!budget) {
    throw new Error(`budget ${req.params.uuid} does not belong to user`);
  }
  await ynabService.deleteScheduledTransaction(
    user,
    budget.uuid,
    transactionId
  );
  res.json({ success: true });
};
