import { describe, it, vi, expect, beforeEach } from "vitest";
import { Request, Response } from "express";
import {
  getUncategorizedTransactionsForBudget,
  getUnapprovedTransactionsForBudget,
  getCachedSuggestionsForBudget,
} from "./aiSuggestionsController";

// Mock dependencies
const mocks = vi.hoisted(() => ({
  getUserFromReq: vi.fn(),
  getBudget: vi.fn(),
  getUncategorizedTransactions: vi.fn(),
  getUnapprovedTransactions: vi.fn(),
  getAllCachedSuggestions: vi.fn(),
}));

vi.mock("./utils", () => ({
  getUserFromReq: mocks.getUserFromReq,
}));

vi.mock("../data/budget/budget.server", () => ({
  getBudget: mocks.getBudget,
}));

vi.mock("../data/transaction/transaction.server", () => ({
  getAllCachedAISuggestions: mocks.getAllCachedSuggestions,
}));

vi.mock("../data/ynab/ynab-api", () => ({
  getUncategorizedTransactions: mocks.getUncategorizedTransactions,
  getUnapprovedTransactions: mocks.getUnapprovedTransactions,
}));

const createMockResponse = () => {
  const res: Partial<Response> = {};
  res.json = vi.fn().mockReturnValue(res);
  res.status = vi.fn().mockReturnValue(res);
  return res as Response;
};

const mockUser = {
  authId: "test-user",
  name: "Test User",
};

const mockBudget = {
  _id: "507f1f77bcf86cd799439011",
  uuid: "test-budget-uuid",
  name: "Test Budget",
};

describe("AI Suggestions Controller", () => {
  let req: Partial<Request>;
  let res: Response;

  beforeEach(() => {
    vi.clearAllMocks();
    res = createMockResponse();
    req = {
      params: { uuid: "test-budget-uuid" },
    };
  });

  describe("getUncategorizedTransactionsForBudget", () => {
    it("should return uncategorized transactions successfully", async () => {
      const mockTransactions = [
        {
          uuid: "tx1",
          payeeName: "Test Store",
          amount: -50.0,
          date: "2024-01-15",
          memo: "Test purchase",
          categoryId: null,
        },
      ];

      mocks.getUserFromReq.mockResolvedValue(mockUser);
      mocks.getBudget.mockResolvedValue(mockBudget);
      mocks.getUncategorizedTransactions.mockResolvedValue(mockTransactions);

      await getUncategorizedTransactionsForBudget(req as Request, res);

      expect(mocks.getUserFromReq).toHaveBeenCalledWith(req);
      expect(mocks.getBudget).toHaveBeenCalledWith(
        "test-budget-uuid",
        mockUser
      );
      expect(mocks.getUncategorizedTransactions).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
      expect(res.json).toHaveBeenCalledWith([
        {
          transaction_id: "tx1",
          payee_name: "Test Store",
          amount: -50.0,
          date: "2024-01-15",
          memo: "Test purchase",
          category_name: null,
          category_id: null,
          approved: false,
        },
      ]);
    });

    it("should return 401 when user not found", async () => {
      mocks.getUserFromReq.mockResolvedValue(null);

      await getUncategorizedTransactionsForBudget(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    it("should return 404 when budget not found", async () => {
      mocks.getUserFromReq.mockResolvedValue(mockUser);
      mocks.getBudget.mockResolvedValue(null);

      await getUncategorizedTransactionsForBudget(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Budget not found or access denied",
      });
    });
  });

  describe("getCachedSuggestionsForBudget", () => {
    it("should return cached suggestions successfully", async () => {
      const mockSuggestions = [
        {
          transaction_id: "tx1",
          payee_name: "Test Store",
          suggested_category_name: "Groceries",
          confidence: 0.8,
          cached_at: new Date("2024-01-15"),
        },
      ];

      mocks.getUserFromReq.mockResolvedValue(mockUser);
      mocks.getBudget.mockResolvedValue(mockBudget);
      mocks.getAllCachedSuggestions.mockResolvedValue(mockSuggestions);

      await getCachedSuggestionsForBudget(req as Request, res);

      expect(mocks.getAllCachedSuggestions).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
      expect(res.json).toHaveBeenCalledWith(mockSuggestions);
    });
  });
});
