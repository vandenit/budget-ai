import { describe, expect, it } from "vitest";
import { categoryUsageReducer } from "../../../../app/api/utils/category.usage.reducer";
import { Transaction } from "@/app/api/transaction/transaction.utils";

describe("categoryUsageReducer", () => {
  it("should return an array with a single category usage when given a single transaction", () => {
    const transaction: Transaction = {
      id: "123",
      date: "2021-01-01",
      amount: 100,
      categoryName: "Groceries",
      categoryId: "123",
      accountName: "Checking",
      payeeName: "Walmart",
      memo: "Groceries",
    };
    const result = categoryUsageReducer([], transaction);
    expect(result).toEqual([
      {
        name: "Groceries",
        amount: 100,
        uuid: "123",
        transactions: [transaction],
      },
    ]);
  });
  it("should increment the amount and add the transaction to the category usage when given a transaction for an existing category usage", () => {
    const transaction: Transaction = {
      id: "123",
      date: "2021-01-01",
      amount: 100,
      categoryName: "Groceries",
      categoryId: "123",
      accountName: "Checking",
      payeeName: "Walmart",
      memo: "Groceries",
    };
    const result = categoryUsageReducer(
      [
        {
          name: "Groceries",
          amount: 100,
          uuid: "123",
          transactions: [transaction],
        },
      ],
      transaction
    );
    expect(result).toEqual([
      {
        name: "Groceries",
        amount: 200,
        uuid: "123",
        transactions: [transaction, transaction],
      },
    ]);
  });

  it("should add a new category usage when a category usage for a different category than the transaction is given", () => {
    const transaction: Transaction = {
      id: "123",
      date: "2021-01-01",
      amount: 100,
      categoryName: "Groceries",
      categoryId: "123",
      accountName: "Checking",
      payeeName: "Walmart",
      memo: "Groceries",
    };
    const result = categoryUsageReducer(
      [
        {
          name: "Rent",
          amount: 100,
          uuid: "123",
          transactions: [transaction],
        },
      ],
      transaction
    );
    expect(result).toEqual([
      {
        name: "Rent",
        amount: 100,
        uuid: "123",
        transactions: [transaction],
      },
      {
        name: "Groceries",
        amount: 100,
        uuid: "123",
        transactions: [transaction],
      },
    ]);
  });
  it("can be used to map an array of transactions to an array of category usages", () => {
    const transactions: Transaction[] = [
      {
        id: "123",
        date: "2021-01-01",
        amount: 100,
        categoryName: "Groceries",
        categoryId: "123",
        accountName: "Checking",
        payeeName: "Walmart",
        memo: "Groceries",
      },
      {
        id: "124",
        date: "2021-01-01",
        amount: 100,
        categoryName: "Rent",
        categoryId: "123",
        accountName: "Checking",
        payeeName: "Walmart",
        memo: "Rent",
      },
    ];
    const result = transactions.reduce(categoryUsageReducer, []);
    expect(result).toEqual([
      {
        name: "Groceries",
        amount: 100,
        uuid: "123",
        transactions: [transactions[0]],
      },
      {
        name: "Rent",
        amount: 100,
        uuid: "123",
        transactions: [transactions[1]],
      },
    ]);
  });
});
