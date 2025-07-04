import { describe, it, vi, expect, beforeEach, afterEach } from "vitest";
import { create } from "./scheduledTransactionController";
import { Response } from "express";

const createMockResponse = () => {
  const res: Partial<Response> = {};
  res.json = vi.fn().mockReturnValue(res);
  res.status = vi.fn().mockReturnValue(res);
  return res as Response;
};

const mocks = vi.hoisted(() => {
  return {
    getUserFromReq: vi.fn(),
    getBudget: vi.fn(),
    createScheduledTransaction: vi.fn(),
  };
});

vi.mock("./utils", () => ({
  getUserFromReq: mocks.getUserFromReq,
}));

vi.mock("../data/budget/budget.server", () => ({
  getBudget: mocks.getBudget,
}));

vi.mock("../data/ynab/ynab.server", () => ({
  createScheduledTransaction: mocks.createScheduledTransaction,
}));

const mockUser = {
  _id: "user123",
  authId: "auth123",
  name: "Test User",
};

const mockBudget = {
  _id: "budget123",
  uuid: "budget-uuid-123",
  name: "Test Budget",
};

const mockCreatedTransaction = {
  id: "transaction123",
  account_id: "account123",
  category_id: "category123",
  payee_name: "Test Payee",
  memo: "Test memo",
  amount: 10000, // In milliunits
  date: "2024-01-15",
};

describe("scheduledTransactionController.create", () => {
  let res: Response;

  beforeEach(() => {
    res = createMockResponse();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create a scheduled transaction successfully", async () => {
    // Arrange
    const req: any = {
      params: { uuid: "budget-uuid-123" },
      body: {
        amount: 100,
        categoryId: "category123",
        date: "2024-01-15",
        payeeName: "Test Payee",
        memo: "Test memo",
        accountId: "account123",
      },
    };

    mocks.getUserFromReq.mockResolvedValue(mockUser);
    mocks.getBudget.mockResolvedValue(mockBudget);
    mocks.createScheduledTransaction.mockResolvedValue(mockCreatedTransaction);

    // Act
    await create(req, res);

    // Assert
    expect(mocks.getUserFromReq).toHaveBeenCalledWith(req);
    expect(mocks.getBudget).toHaveBeenCalledWith("budget-uuid-123", mockUser);
    expect(mocks.createScheduledTransaction).toHaveBeenCalledWith(
      mockUser,
      "budget-uuid-123",
      {
        amount: 100,
        categoryId: "category123",
        date: "2024-01-15",
        payeeName: "Test Payee",
        memo: "Test memo",
        accountId: "account123",
      }
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockCreatedTransaction);
  });

  it("should throw error when user is not found", async () => {
    // Arrange
    const req: any = {
      params: { uuid: "budget-uuid-123" },
      body: {
        amount: 100,
        categoryId: "category123",
        date: "2024-01-15",
        accountId: "account123",
      },
    };

    mocks.getUserFromReq.mockResolvedValue(null);

    // Act & Assert
    await expect(create(req, res)).rejects.toThrow("no user found");
  });

  it("should throw error when budget is not found", async () => {
    // Arrange
    const req: any = {
      params: { uuid: "budget-uuid-123" },
      body: {
        amount: 100,
        categoryId: "category123",
        date: "2024-01-15",
        accountId: "account123",
      },
    };

    mocks.getUserFromReq.mockResolvedValue(mockUser);
    mocks.getBudget.mockResolvedValue(null);

    // Act & Assert
    await expect(create(req, res)).rejects.toThrow(
      "budget budget-uuid-123 does not belong to user"
    );
  });

  it("should throw error when required fields are missing", async () => {
    // Arrange
    const req: any = {
      params: { uuid: "budget-uuid-123" },
      body: {
        // Missing required fields
        categoryId: "category123",
        date: "2024-01-15",
      },
    };

    mocks.getUserFromReq.mockResolvedValue(mockUser);
    mocks.getBudget.mockResolvedValue(mockBudget);

    // Act & Assert
    await expect(create(req, res)).rejects.toThrow(
      "Missing required fields: amount, categoryId, date, accountId"
    );
  });

  it("should throw error when amount is not a valid number", async () => {
    // Arrange
    const req: any = {
      params: { uuid: "budget-uuid-123" },
      body: {
        amount: "invalid",
        categoryId: "category123",
        date: "2024-01-15",
        accountId: "account123",
      },
    };

    mocks.getUserFromReq.mockResolvedValue(mockUser);
    mocks.getBudget.mockResolvedValue(mockBudget);

    // Act & Assert
    await expect(create(req, res)).rejects.toThrow(
      "Amount must be a valid number"
    );
  });

  it("should throw error when date format is invalid", async () => {
    // Arrange
    const req: any = {
      params: { uuid: "budget-uuid-123" },
      body: {
        amount: 100,
        categoryId: "category123",
        date: "invalid-date",
        accountId: "account123",
      },
    };

    mocks.getUserFromReq.mockResolvedValue(mockUser);
    mocks.getBudget.mockResolvedValue(mockBudget);

    // Act & Assert
    await expect(create(req, res)).rejects.toThrow(
      "Date must be in YYYY-MM-DD format"
    );
  });

  it("should sanitize string inputs", async () => {
    // Arrange
    const req: any = {
      params: { uuid: "budget-uuid-123" },
      body: {
        amount: 100,
        categoryId: "  category123  ",
        date: "2024-01-15", // Date validation happens before trimming, so no spaces
        payeeName: "  Test Payee  ",
        memo: "  Test memo  ",
        accountId: "  account123  ",
      },
    };

    mocks.getUserFromReq.mockResolvedValue(mockUser);
    mocks.getBudget.mockResolvedValue(mockBudget);
    mocks.createScheduledTransaction.mockResolvedValue(mockCreatedTransaction);

    // Act
    await create(req, res);

    // Assert
    expect(mocks.createScheduledTransaction).toHaveBeenCalledWith(
      mockUser,
      "budget-uuid-123",
      {
        amount: 100,
        categoryId: "category123",
        date: "2024-01-15", // Date is not trimmed in this test since it has no spaces
        payeeName: "Test Payee",
        memo: "Test memo",
        accountId: "account123",
      }
    );
  });

  it("should handle optional fields correctly", async () => {
    // Arrange
    const req: any = {
      params: { uuid: "budget-uuid-123" },
      body: {
        amount: 100,
        categoryId: "category123",
        date: "2024-01-15",
        accountId: "account123",
        // No payeeName or memo
      },
    };

    mocks.getUserFromReq.mockResolvedValue(mockUser);
    mocks.getBudget.mockResolvedValue(mockBudget);
    mocks.createScheduledTransaction.mockResolvedValue(mockCreatedTransaction);

    // Act
    await create(req, res);

    // Assert
    expect(mocks.createScheduledTransaction).toHaveBeenCalledWith(
      mockUser,
      "budget-uuid-123",
      {
        amount: 100,
        categoryId: "category123",
        date: "2024-01-15",
        payeeName: undefined,
        memo: undefined,
        accountId: "account123",
      }
    );
  });
});
