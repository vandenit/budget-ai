import { redirect } from "next/navigation";
import BudgetPage from "./components/budget-page";
import {
  getLoggedInUserPreferredBudgetId as getLoggedInUserPreferredBudgetUuid,
  isYnabTokenExpired
} from "./api/user/user.client";
import { findBudgets } from "./api/budget/budget.client";

export default async function Home() {
  const ynabTokenExpired = await isYnabTokenExpired();
  if (ynabTokenExpired) {
    redirect("/ynablogin");
  }
  const budgets = await findBudgets();
  if (budgets.length === 0) {
    //   redirect("/login");
  }
  const preferredBudget = await getLoggedInUserPreferredBudgetUuid();
  const budgetUuid = preferredBudget || budgets[0]?.uuid;
  if (!budgetUuid) {
    return <div>No budgets found</div>;
  }
  return <BudgetPage budgetUuid={budgetUuid} />;
}
