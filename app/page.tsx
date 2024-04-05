import Image from "next/image";
import { redirect } from "next/navigation";
import { getCachedBudgets } from "./api/main.budget.server";
import BudgetPage from "./components/budget-page";
import {
  getLoggedInUser,
  getLoggedInUserPreferredBudgetId as getLoggedInUserPreferredBudgetUuid,
} from "./api/user/user.server";
import { useUser } from "@auth0/nextjs-auth0/client";
import { getSession } from "@auth0/nextjs-auth0";
import { isYnabTokenExpired } from "./api/ynab/ynab-api";

export default async function Home() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  const ynabTokenExpired = await isYnabTokenExpired();
  if (ynabTokenExpired) {
    redirect("/ynablogin");
  }
  const budgets = await getCachedBudgets();
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
