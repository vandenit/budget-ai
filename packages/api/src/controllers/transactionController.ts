import { Request, Response } from "express";
import { Transaction } from "common-ts";

// Mock data
const transactions: Transaction[] = [
  {
    uuid: "1",
    accountName: "Checking",
    amount: 100,
    date: "2021-01-01",
    categoryName: "Groceries",
    categoryId: "1",
    payeeName: "Walmart",
    memo: "",
  },
  {
    uuid: "2",
    accountName: "Checking",
    amount: 50,
    date: "2021-01-02",
    categoryName: "Gas",
    categoryId: "2",
    payeeName: "Exxon",
    memo: "",
  },
];

export const getAllTransactions = (req: Request, res: Response) => {
  res.json(transactions);
};
