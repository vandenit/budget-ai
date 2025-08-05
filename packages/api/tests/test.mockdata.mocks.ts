import { am, c } from "vitest/dist/reporters-5f784f42.js";

export const mockTransactions = [
  {
    id: "1",
    name: "mock transaction",
    categoryId: "1",
    amount: 100,
    cleanPayeeName: "mock payee",
    memo: "test memo 1",
  },
  {
    id: "1",
    name: "mock transaction",
    categoryId: "1",
    amount: 200,
    cleanPayeeName: "mock payee 2",
    memo: "test memo 2",
  },
];

export const mockCategories = [
  {
    _id: "1",
    key: "mock category",
  },
  {
    _id: "2",
    key: "mock category 2",
  },
];

export const mockUser = {
  // Mocked user object
  authId: "test",
  name: "Test User",
  // Add other necessary user properties
};

export const mockBudget = {
  // Mocked budget object
  id: "test",
  name: "Test Budget",
  // Add other necessary budget properties
};
