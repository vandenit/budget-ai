import "server-only";
import { apiGet } from "../client";
import { TransactionsWithCategories } from "common-ts";

export const getFilteredTransactionsWithCategories = async (
  budgetUuid: string,
  month?: string,
  dayOfMonth?: string
): Promise<TransactionsWithCategories> =>
  apiGet(
    `budgets/${budgetUuid}/transactions?month=${
      month ? month : ""
    }&dayOfMonth=${dayOfMonth ? dayOfMonth : ""}`
  );