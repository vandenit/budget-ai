"use client";
import Link from "next/link";
import { SignOut } from "./login";
import { useParams, usePathname } from "next/navigation";
import { Budget } from "common-ts";

type Props = {
  budgets: Budget[];
  loggedIn: boolean;
};

const BudgetNavigation = ({ budgets, loggedIn }: Props) => {
  const signOut = loggedIn ? <SignOut /> : "";
  const params = useParams();
  const pathname = usePathname();
  const currentBudgetId = params ? params.budgetUuid : "";

  // Extract the sub-route from current pathname to preserve it when switching budgets
  const getSubRoute = () => {
    if (!pathname || pathname === "/") return "";

    // Match patterns like /budgets/[uuid]/subpath
    const match = pathname.match(/^\/budgets\/[^\/]+\/(.+)$/);
    return match ? `/${match[1]}` : "";
  };

  const getBudgetHref = (budgetUuid: string) => {
    const subRoute = getSubRoute();
    return `/budgets/${budgetUuid}${subRoute}`;
  };

  const getActiveClass = (budgetId: string) =>
    `link ${currentBudgetId === budgetId ? "active" : ""}`;
  return (
    <div className="navbar bg-base-100">
      <div className="navbar-start">
        <div className="dropdown">
          <label tabIndex={0} className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </label>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
          >
            {budgets.map((budget) => (
              <li className="mr-6" key={budget.uuid}>
                <Link
                  className={getActiveClass(budget.uuid)}
                  href={getBudgetHref(budget.uuid)}
                >
                  {budget.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <Link href="/" className="btn btn-ghost normal-case text-xl">
          Budget AI
        </Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          {budgets.map((budget) => (
            <li className="mr-6" key={budget.uuid}>
              <Link
                className={getActiveClass(budget.uuid)}
                href={getBudgetHref(budget.uuid)}
              >
                {budget.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="navbar-end">{signOut}</div>
    </div>
  );
};

export default BudgetNavigation;
