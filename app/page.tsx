import { getServerSession } from "next-auth";
import Image from "next/image";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getCachedBudgets } from "./api/budget.server";
import BudgetPage from "./components/budget-page";
import { getLoggedInUserPreferredBudgetId } from "./api/user/user.server";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  const budgets = await getCachedBudgets();
  if (budgets.length === 0) {
    redirect("/login");
  }
  const preferredBudget = await getLoggedInUserPreferredBudgetId();

  return <BudgetPage budgetId={preferredBudget || budgets[0].id} />;
}
