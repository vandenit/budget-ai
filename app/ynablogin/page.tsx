import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SignIn, SignOut, YnabSignIn } from "../components/login";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { getCachedBudgets } from "../api/budget.server";
import BudgetPage from "../components/budget-page";

const YnabLoginPage = () => (
  <div className="flex min-h-full flex-col items-center justify-center">
    <h1 className="mb-12"></h1>
    <div className="items center mx-auto flex w-full max-w-md justify-center px-8">
      <YnabSignIn />
    </div>
  </div>
);

export default YnabLoginPage;
