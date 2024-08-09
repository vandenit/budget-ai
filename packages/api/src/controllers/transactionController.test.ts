import { describe, it, vi, expect, afterEach, beforeEach } from "vitest";
import { getFilteredTransactionsWithCategories } from "./transactionController";
import {
  mockCategories,
  mockTransactions,
} from "../../tests/test.mockdata.mocks";
import { Response } from "express";

const createMockResponse = () => {
  const res: Partial<Response> = {};
  res.json = vi.fn().mockReturnValue(res);
  res.status = vi.fn().mockReturnValue(res);
  return res as Response;
};

const res = createMockResponse();

const mocks = vi.hoisted(() => {
  return {
    getFilteredTransactions: vi.fn(),
    findCategories: vi.fn(),
    getUserByAuthId: vi.fn(),
    getBudgetBudget: vi.fn(),
  };
});

vi.mock("../data/user/user.server", () => ({
  getUserByAuthId: mocks.getUserByAuthId,
}));

vi.mock("../data/budget/budget.server", () => ({
  getBudget: mocks.getBudgetBudget,
}));

vi.mock("../data/main.budget.server", () => ({
  getFilteredTransactions: mocks.getFilteredTransactions,
}));
vi.mock("../data/category/category.server", () => ({
  findCategories: mocks.findCategories,
}));

const mockUser = {
  // Mocked user object
  authId: "test",
  name: "Test User",
  // Add other necessary user properties
};

const mockBudget = {
  // Mocked budget object
  id: "test",
  name: "Test Budget",
  // Add other necessary budget properties
};

const req: any = {
  auth: {
    payload: {
      sub: "test",
    },
  },
  params: {
    uuid: "test",
  },
  query: {
    month: "1",
    dayOfMonth: "1",
  },
};

describe("getFilteredTransactionsWithCategories", () => {
  mocks.getFilteredTransactions.mockResolvedValue(mockTransactions);
  mocks.findCategories.mockResolvedValue(mockCategories);
  mocks.getUserByAuthId.mockResolvedValue(mockUser);
  mocks.getBudgetBudget.mockResolvedValue(mockBudget);

  it("should return the transactions and filtered categories", async () => {
    // Act
    await getFilteredTransactionsWithCategories(req, res);
    //
    // Assert
    expect(res.json).toHaveBeenCalledWith({
      transactions: mockTransactions,
      // only categories present in the transactions should be returned
      // with amount of transaction
      categories: [
        {
          _id: "1",
          key: "mock category",
          activity: 100,
        },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});
