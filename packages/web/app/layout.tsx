import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import BudgetNavigation from "./components/budget-navigation";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { getSession } from "@auth0/nextjs-auth0";
import { findBudgets } from "./api/budget/budget.client";
import { useEffect } from "react";
import { overrideConsoleLog } from "common-ts";
import { Toaster } from "@/components/ui/sonner";

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
  overrideConsoleLog();

  const session = await getSession();
  const isLoggedIn: boolean = !!session?.user;
  const budgets = session && isLoggedIn ? await findBudgets() : [];
  return (
    <UserProvider>
      <html lang="en" data-theme="dark" className="dark">
        <body className="dark:bg-background dark:text-foreground">
          <BudgetNavigation budgets={budgets} loggedIn={isLoggedIn} />
          <main className="container mx-auto p-2">{children}</main>
          <Toaster />
        </body>
      </html>
    </UserProvider>
  );
}
