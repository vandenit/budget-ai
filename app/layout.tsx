import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import BudgetNavigation from "./components/budget-navigation";
import { getBudgets } from "./api/budget.server";

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
  const budgets = await getBudgets();
  return (
    <html lang="en" data-theme="dark">
      <body className={inter.className}>
        <BudgetNavigation budgets={budgets} />
        <main className="container mx-auto p-2">{children}</main>
      </body>
    </html>
  );
}
