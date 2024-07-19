import { TransactionDetail } from "ynab";
import { extractYearsFromTransactions } from "./transaction.util";
import { describe, expect, it } from "vitest";

describe("extractYearsFromTransactions", () => {
  it("should return a sorted array of unique years extracted from transactions", () => {
    const transactions = [
      { date: "2023-06-20", amount: 150 },
      { date: "2021-01-01", amount: 100 },
      { date: "2021-02-15", amount: -50 },
      { date: "2022-03-10", amount: 200 },
      { date: "2022-04-05", amount: -75 },
    ];

    const result = extractYearsFromTransactions(transactions as any);

    expect(result).toEqual(["2021", "2022", "2023"]);
  });

  it("should return an empty array if no transactions are provided", () => {
    const transactions: TransactionDetail[] = [];

    const result = extractYearsFromTransactions(transactions);

    expect(result).toEqual([]);
  });

  it("should handle transactions with invalid date format", () => {
    const transactions = [
      { date: "2021-01-01", amount: 100 },
      { date: "2021-02-15", amount: -50 },
      { date: "2022-03", amount: 200 }, // Invalid date format
      { date: "2022-04-05", amount: -75 },
    ];

    const result = extractYearsFromTransactions(transactions as any);

    expect(result).toEqual(["2021", "2022"]);
  });
});
