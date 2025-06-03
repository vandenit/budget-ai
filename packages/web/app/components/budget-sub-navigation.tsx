"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaHome, FaCreditCard, FaChartLine, FaRobot } from "react-icons/fa";

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

    const getNavItemClass = (path: string) => {
        const baseClass = "inline-flex items-center gap-3 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative";

        if (isActive(path)) {
            return `${baseClass} bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 shadow-sm`;
        }

        return `${baseClass} text-slate-600 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800`;
    };

    const navItems = [
        {
            href: `/budgets/${budgetUuid}`,
            icon: <FaHome className="w-4 h-4" />,
            label: "Overview",
            path: `/budgets/${budgetUuid}`
        },
        {
            href: `/budgets/${budgetUuid}/transactions`,
            icon: <FaCreditCard className="w-4 h-4" />,
            label: "Transactions",
            path: `/budgets/${budgetUuid}/transactions`
        },
        {
            href: `/budgets/${budgetUuid}/predictions`,
            icon: <FaChartLine className="w-4 h-4" />,
            label: "Predictions",
            path: `/budgets/${budgetUuid}/predictions`
        },
        {
            href: `/budgets/${budgetUuid}/uncategorised`,
            icon: <FaRobot className="w-4 h-4" />,
            label: "AI Assistant",
            path: `/budgets/${budgetUuid}/uncategorised`
        }
    ];

    return (
        <div className="mb-8">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-2">
                <nav className="flex flex-wrap justify-center gap-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            href={item.href}
                            className={getNavItemClass(item.path)}
                        >
                            {item.icon}
                            <span className="hidden sm:inline">{item.label}</span>

                            {/* Active indicator */}
                            {isActive(item.path) && (
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full"></div>
                            )}
                        </Link>
                    ))}
                </nav>
            </div>
        </div>
    );
}