import Image from "next/image";
import { redirect } from "next/navigation";
import { getCachedBudgets } from "./api/budget.server";
import BudgetPage from "./components/budget-page";
import {
  getLoggedInUser,
  getLoggedInUserPreferredBudgetId,
} from "./api/user/user.server";
import { useUser } from "@auth0/nextjs-auth0/client";
import { getSession } from "@auth0/nextjs-auth0";
import { isYnabTokenExpired } from "./api/ynab-api";

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
  const preferredBudget = await getLoggedInUserPreferredBudgetId();

  return <BudgetPage budgetId={preferredBudget || budgets[0]?.id} />;
}
