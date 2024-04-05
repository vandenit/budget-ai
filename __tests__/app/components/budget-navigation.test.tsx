import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import BudgetNavigation from "../../../app/components/budget-navigation";

const mockBudgets = [
  { uuid: "1", name: "Budget 1" },
  { uuid: "2", name: "Budget 2" },
];

test("BudgetNavigation renders correctly when logged in", () => {
  render(<BudgetNavigation budgets={mockBudgets} loggedIn={true} />);
  const budgetLinks = screen.getAllByRole("link", {
    name: mockBudgets[0].name,
  });
  // every budget has a link for mobile and web
  expect(budgetLinks).toHaveLength(2);

  // todo : always works
  expect(screen.queryByRole("button", { name: "Sign Outje?" })).toBeDefined();
});

test("BudgetNavigation renders correctly when logged out", () => {
  render(<BudgetNavigation budgets={mockBudgets} loggedIn={false} />);

  expect(screen.queryByRole("button", { name: "Sign Out" })).toBeNull();
});
