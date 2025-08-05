import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { findTransactions, getAllCachedAISuggestionsForBudget } from "./transaction.server";
import { LocalTransaction } from "./transaction.schema";

const mocks = vi.hoisted(() => {
  return {
    connectDb: vi.fn(),
  };
});

vi.mock("../db", () => ({
  default: mocks.connectDb,
}));

mocks.connectDb.mockResolvedValue(null);

const mockDbTransactions = [
  {
    uuid: "1",
    accountName: "Account 1",
    amount: 1000,
    date: "2022-01-01T00:00:00Z",
    categoryId: "1",
    payeeName: "Payee 1",
    memo: "Memo 1",
  },
];

describe("findTransactions", () => {
  const sortMock = vi.fn();
  const findMock = vi.fn();
  vi.mocked(LocalTransaction).find = findMock;

  beforeEach(() => {
    findMock.mockReturnValue({
      sort: sortMock,
    });

    sortMock.mockResolvedValue(mockDbTransactions);
  });

  it("should find the transactions with the correct filter if date is given", async () => {
    // Arrange
    const budgetId = "2";
    const dateString = "2022-02";

    // Act
    const result = await findTransactions(budgetId, dateString);

    // Assert
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);

    expect(findMock).toHaveBeenCalledWith({
      budgetId,
      date: { $regex: `^${dateString}` },
    });
    expect(sortMock).toHaveBeenCalledWith({ date: -1 });
  });

  it("should find the transactions with the correct filter if no date info is given", async () => {
    // Arrange
    const budgetId = "2";

    // Act
    const result = await findTransactions(budgetId);

    // Assert
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);

    expect(findMock).toHaveBeenCalledWith({
      budgetId,
      date: { $exists: true },
    });
  });

  it("should use import_payee_name_original as payeeName when available", async () => {
    // Arrange
    const budgetId = "2";
    const mockTransactionsWithOriginal = [
      {
        uuid: "1",
        accountName: "Account 1",
        amount: 1000,
        date: "2022-01-01T00:00:00Z",
        categoryId: "1",
        payeeName: "PayPal",
        import_payee_name_original: "PayPal (Europe) S.a r.l. et Cie, S. Domiciliëring 1043588586390 PAYPAL",
        memo: "Memo 1",
      },
    ];

    sortMock.mockResolvedValueOnce(mockTransactionsWithOriginal);

    // Act
    const result = await findTransactions(budgetId);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].payeeName).toBe("PayPal (Europe) S.a r.l. et Cie, S. Domiciliëring 1043588586390 PAYPAL");
    expect(result[0].cleanPayeeName).toBe("PayPal");
    expect(result[0].import_payee_name_original).toBe("PayPal (Europe) S.a r.l. et Cie, S. Domiciliëring 1043588586390 PAYPAL");
  });

  it("should fallback to payeeName when import_payee_name_original is not available", async () => {
    // Arrange
    const budgetId = "2";
    const mockTransactionsWithoutOriginal = [
      {
        uuid: "1",
        accountName: "Account 1",
        amount: 1000,
        date: "2022-01-01T00:00:00Z",
        categoryId: "1",
        payeeName: "PayPal",
        import_payee_name_original: null,
        memo: "Memo 1",
      },
    ];

    sortMock.mockResolvedValueOnce(mockTransactionsWithoutOriginal);

    // Act
    const result = await findTransactions(budgetId);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].payeeName).toBe("PayPal");
    expect(result[0].cleanPayeeName).toBe("PayPal");
    expect(result[0].import_payee_name_original).toBe(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});

describe("getAllCachedAISuggestionsForBudget", () => {
  const sortMock = vi.fn();
  const limitMock = vi.fn();
  const findMock = vi.fn();

  beforeEach(() => {
    vi.mocked(LocalTransaction).find = findMock;
    findMock.mockReturnValue({
      sort: sortMock,
    });
    sortMock.mockReturnValue({
      limit: limitMock,
    });
  });

  it("should use import_payee_name_original as payee_name when available", async () => {
    // Arrange
    const budgetId = "test-budget-id";
    const mockTransactions = [
      {
        uuid: "tx-1",
        payeeName: "PayPal",
        import_payee_name_original: "PayPal (Europe) S.a r.l. et Cie, S. Domiciliëring 1043588586390 PAYPAL",
        ai_suggested_category: "Online Services",
        ai_suggestion_confidence: 0.9,
        ai_suggestion_date: new Date("2023-01-01"),
      },
    ];

    limitMock.mockResolvedValue(mockTransactions);

    // Act
    const result = await getAllCachedAISuggestionsForBudget(budgetId);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].transaction_id).toBe("tx-1");
    expect(result[0].payee_name).toBe("PayPal (Europe) S.a r.l. et Cie, S. Domiciliëring 1043588586390 PAYPAL");
    expect(result[0].suggested_category_name).toBe("Online Services");
    expect(result[0].confidence).toBe(0.9);
  });

  it("should fallback to payeeName when import_payee_name_original is not available", async () => {
    // Arrange
    const budgetId = "test-budget-id";
    const mockTransactions = [
      {
        uuid: "tx-2",
        payeeName: "PayPal",
        import_payee_name_original: null,
        ai_suggested_category: "Online Services",
        ai_suggestion_confidence: 0.8,
        ai_suggestion_date: new Date("2023-01-01"),
      },
    ];

    limitMock.mockResolvedValue(mockTransactions);

    // Act
    const result = await getAllCachedAISuggestionsForBudget(budgetId);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].transaction_id).toBe("tx-2");
    expect(result[0].payee_name).toBe("PayPal");
    expect(result[0].suggested_category_name).toBe("Online Services");
    expect(result[0].confidence).toBe(0.8);
  });

  it("should handle empty payeeName gracefully", async () => {
    // Arrange
    const budgetId = "test-budget-id";
    const mockTransactions = [
      {
        uuid: "tx-3",
        payeeName: null,
        import_payee_name_original: null,
        ai_suggested_category: "Unknown",
        ai_suggestion_confidence: 0.5,
        ai_suggestion_date: new Date("2023-01-01"),
      },
    ];

    limitMock.mockResolvedValue(mockTransactions);

    // Act
    const result = await getAllCachedAISuggestionsForBudget(budgetId);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].transaction_id).toBe("tx-3");
    expect(result[0].payee_name).toBe("");
    expect(result[0].suggested_category_name).toBe("Unknown");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});
