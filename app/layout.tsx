import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import BudgetNavigation from "./components/budget-navigation";
import { getCachedBudgets } from "./api/budget.server";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

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
  const session = await getServerSession(authOptions);
  const budgets = session ? await getCachedBudgets() : [];
  return (
    <html lang="en">
      <body>
        <BudgetNavigation budgets={budgets} loggedIn={session !== null} />
        <main className="container mx-auto p-2">{children}</main>
      </body>
    </html>
  );
}
