import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import BudgetNavigation from "./components/budget-navigation";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { getSession } from "@auth0/nextjs-auth0";
import { findCachedBudgers } from "./api/budget/budget.client";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Budget AI",
  description: "Your smart budget app",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const isLoggedIn: boolean = !!session?.user;
  const budgets = session && isLoggedIn ? await findCachedBudgers() : [];
  return (
    <UserProvider>
      <html lang="en" data-theme="dark">
        <body>
          <BudgetNavigation budgets={budgets} loggedIn={isLoggedIn} />
          <main className="container mx-auto p-2">{children}</main>
        </body>
      </html>
    </UserProvider>
  );
}
