"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

interface Props {
    budgetUuid: string;
}

export default function BudgetSubNavigation({ budgetUuid }: Props) {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === `/budgets/${budgetUuid}`) {
            return pathname === path;
        }
        return pathname.startsWith(path);
    };

    const getNavItemClass = (path: string) =>
        `tab tab-bordered ${isActive(path) ? 'tab-active' : ''}`;

    return (
        <div className="mb-6">
            <div className="tabs tabs-boxed justify-center w-full">
                <Link
                    href={`/budgets/${budgetUuid}`}
                    className={getNavItemClass(`/budgets/${budgetUuid}`)}
                >
                    <span className="mr-2">🏠</span>
                    Overview
                </Link>
                <Link
                    href={`/budgets/${budgetUuid}/transactions`}
                    className={getNavItemClass(`/budgets/${budgetUuid}/transactions`)}
                >
                    <span className="mr-2">💳</span>
                    Transactions
                </Link>
                <Link
                    href={`/budgets/${budgetUuid}/predictions`}
                    className={getNavItemClass(`/budgets/${budgetUuid}/predictions`)}
                >
                    <span className="mr-2">📈</span>
                    Predictions
                </Link>
                <Link
                    href={`/budgets/${budgetUuid}/uncategorised`}
                    className={getNavItemClass(`/budgets/${budgetUuid}/uncategorised`)}
                >
                    <span className="mr-2">🤖</span>
                    AI Assistant
                </Link>
            </div>
        </div>
    );
} 