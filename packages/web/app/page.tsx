import Image from "next/image";
import { redirect } from "next/navigation";
import BudgetPage from "./components/budget-page";
import {
  getLoggedInUserPreferredBudgetId as getLoggedInUserPreferredBudgetUuid,
  isYnabTokenExpired
} from "./api/user/user.client";
import { getSession } from "@auth0/nextjs-auth0";
import { findBudgets } from "./api/budget/budget.client";

export default async function Home() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
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
