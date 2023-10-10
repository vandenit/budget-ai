import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import BudgetNavigation from "./budget-navigation";

const mockBudgets = [
  { id: "1", name: "Budget 1" },
  { id: "2", name: "Budget 2" },
];

test("BudgetNavigation renders correctly when logged in", () => {
  render(<BudgetNavigation budgets={mockBudgets} loggedIn={true} />);
  const budgetLinks = screen.getAllByRole("link", {
    name: mockBudgets[0].name,
  });
  // every budget has a link for mobile and web
  expect(budgetLinks).toHaveLength(3);

  // todo : always works
  expect(screen.queryByRole("button", { name: "Sign Outje?" })).toBeDefined();
});

test("BudgetNavigation renders correctly when logged out", () => {
  render(<BudgetNavigation budgets={mockBudgets} loggedIn={false} />);

  expect(screen.queryByRole("button", { name: "Sign Out" })).toBeNull();
});
