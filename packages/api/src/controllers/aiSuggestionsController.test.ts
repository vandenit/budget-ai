import { describe, it, vi, expect, beforeEach, afterEach } from "vitest";
import { getUncategorizedTransactionsForBudget, getUnapprovedTransactionsForBudget } from "./aiSuggestionsController";
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
    getYnabUncategorizedTransactions: vi.fn(),
    getYnabUnapprovedTransactions: vi.fn(),
    getCachedAISuggestionsBatch: vi.fn(),
    extractPayeeName: vi.fn(),
  };
});

vi.mock("./utils", () => ({
  getUserFromReq: mocks.getUserFromReq,
}));

vi.mock("../data/budget/budget.server", () => ({
  getBudget: mocks.getBudget,
}));

vi.mock("../data/ynab/ynab-api", () => ({
  getUncategorizedTransactions: mocks.getYnabUncategorizedTransactions,
  getUnapprovedTransactions: mocks.getYnabUnapprovedTransactions,
}));

vi.mock("../data/transaction/transaction.server", () => ({
  getCachedAISuggestionsBatch: mocks.getCachedAISuggestionsBatch,
}));

vi.mock("../data/transaction/utils", () => ({
  extractPayeeName: mocks.extractPayeeName,
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

const mockYnabTransactions = [
  {
    id: "tx1",
    payee_name: "PayPal (Europe) S.a r.l. et Cie, S. Domiciliëring 1043588586390 PAYPAL 4YV22252VFQC6 1043588586390 PAYPAL",
    amount: -2500,
    date: "2024-01-15",
    memo: "Online purchase",
    category_name: null,
    category_id: null,
    approved: false,
  },
  {
    id: "tx2", 
    payee_name: "PARKING ALBERTINE 1112 BE1000 BRUXELLES Betaling met KBC-Debetkaart",
    amount: -350,
    date: "2024-01-14",
    memo: "Parking fee",
    category_name: "Transport",
    category_id: "cat123",
    approved: true,
  }
];

describe("aiSuggestionsController", () => {
  let res: Response;

  beforeEach(() => {
    res = createMockResponse();
    vi.clearAllMocks();
    
    // Setup default mocks
    mocks.getUserFromReq.mockResolvedValue(mockUser);
    mocks.getBudget.mockResolvedValue(mockBudget);
    mocks.extractPayeeName.mockImplementation((payeeName: string) => {
      // Mock the extractPayeeName logic
      if (payeeName?.includes("PayPal")) return "PayPal";
      if (payeeName?.includes("PARKING ALBERTINE")) return "PARKING ALBERTINE";
      return payeeName || "";
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getUncategorizedTransactionsForBudget", () => {
    it("should return uncategorized transactions with clean payee names", async () => {
      // Arrange
      const req: any = {
        params: { uuid: "budget-uuid-123" }
      };
      
      mocks.getYnabUncategorizedTransactions.mockResolvedValue(mockYnabTransactions);
      mocks.getCachedAISuggestionsBatch.mockResolvedValue({
        "tx1": "Shopping",
        // tx2 has no cached suggestion
      });

      // Act
      await getUncategorizedTransactionsForBudget(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith([
        {
          transaction_id: "tx1",
          payee_name: "PayPal (Europe) S.a r.l. et Cie, S. Domiciliëring 1043588586390 PAYPAL 4YV22252VFQC6 1043588586390 PAYPAL",
          clean_payee_name: "PayPal",
          amount: -2500,
          date: "2024-01-15",
          memo: "Online purchase",
          category_name: null,
          category_id: null,
          approved: false,
          ai_suggested_category: "Shopping",
        },
        {
          transaction_id: "tx2",
          payee_name: "PARKING ALBERTINE 1112 BE1000 BRUXELLES Betaling met KBC-Debetkaart",
          clean_payee_name: "PARKING ALBERTINE",
          amount: -350,
          date: "2024-01-14",
          memo: "Parking fee",
          category_name: null,
          category_id: null,
          approved: true,
          ai_suggested_category: null,
        }
      ]);
    });

    it("should handle empty payee names gracefully", async () => {
      // Arrange
      const req: any = {
        params: { uuid: "budget-uuid-123" }
      };
      
      const transactionsWithEmptyPayee = [
        {
          id: "tx3",
          payee_name: null,
          amount: -1000,
          date: "2024-01-13",
          memo: "Unknown transaction",
          category_name: null,
          category_id: null,
          approved: false,
        }
      ];
      
      mocks.getYnabUncategorizedTransactions.mockResolvedValue(transactionsWithEmptyPayee);
      mocks.getCachedAISuggestionsBatch.mockResolvedValue({});

      // Act
      await getUncategorizedTransactionsForBudget(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith([
        {
          transaction_id: "tx3",
          payee_name: "",
          clean_payee_name: "",
          amount: -1000,
          date: "2024-01-13",
          memo: "Unknown transaction",
          category_name: null,
          category_id: null,
          approved: false,
          ai_suggested_category: null,
        }
      ]);
    });

    it("should return 401 when user is not authenticated", async () => {
      // Arrange
      const req: any = {
        params: { uuid: "budget-uuid-123" }
      };
      
      mocks.getUserFromReq.mockResolvedValue(null);

      // Act
      await getUncategorizedTransactionsForBudget(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    it("should return 404 when budget is not found", async () => {
      // Arrange
      const req: any = {
        params: { uuid: "nonexistent-budget" }
      };
      
      mocks.getBudget.mockResolvedValue(null);

      // Act
      await getUncategorizedTransactionsForBudget(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Budget not found or access denied" });
    });
  });

  describe("getUnapprovedTransactionsForBudget", () => {
    it("should return unapproved transactions with clean payee names", async () => {
      // Arrange
      const req: any = {
        params: { uuid: "budget-uuid-123" }
      };
      
      mocks.getYnabUnapprovedTransactions.mockResolvedValue(mockYnabTransactions);

      // Act
      await getUnapprovedTransactionsForBudget(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith([
        {
          transaction_id: "tx1",
          payee_name: "PayPal (Europe) S.a r.l. et Cie, S. Domiciliëring 1043588586390 PAYPAL 4YV22252VFQC6 1043588586390 PAYPAL",
          clean_payee_name: "PayPal",
          amount: -2500,
          date: "2024-01-15",
          memo: "Online purchase",
          category_name: null,
          category_id: null,
          approved: false,
        },
        {
          transaction_id: "tx2",
          payee_name: "PARKING ALBERTINE 1112 BE1000 BRUXELLES Betaling met KBC-Debetkaart",
          clean_payee_name: "PARKING ALBERTINE",
          amount: -350,
          date: "2024-01-14",
          memo: "Parking fee",
          category_name: "Transport",
          category_id: "cat123",
          approved: true,
        }
      ]);
    });

    it("should call extractPayeeName for each transaction", async () => {
      // Arrange
      const req: any = {
        params: { uuid: "budget-uuid-123" }
      };
      
      mocks.getYnabUnapprovedTransactions.mockResolvedValue(mockYnabTransactions);

      // Act
      await getUnapprovedTransactionsForBudget(req, res);

      // Assert
      expect(mocks.extractPayeeName).toHaveBeenCalledTimes(2);
      expect(mocks.extractPayeeName).toHaveBeenCalledWith("PayPal (Europe) S.a r.l. et Cie, S. Domiciliëring 1043588586390 PAYPAL 4YV22252VFQC6 1043588586390 PAYPAL");
      expect(mocks.extractPayeeName).toHaveBeenCalledWith("PARKING ALBERTINE 1112 BE1000 BRUXELLES Betaling met KBC-Debetkaart");
    });
  });
});
