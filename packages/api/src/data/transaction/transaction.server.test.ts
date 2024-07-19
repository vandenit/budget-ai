import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { findTransactions } from "./transaction.server";
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

  afterEach(() => {
    vi.restoreAllMocks();
  });
});
