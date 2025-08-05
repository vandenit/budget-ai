"use client";

import React, { useState } from 'react';
import { Category } from 'common-ts';
import UncategorisedTransactionsContent from './UncategorisedTransactionsContent';
import UnapprovedTransactionsContent from './UnapprovedTransactionsContent';
import { SuggestedTransaction } from './UncategorisedTransactionsContent';

interface UnapprovedTransaction {
    transaction_id: string;
    payee_name: string;
    clean_payee_name?: string;
    amount: number;
    date: string;
    memo: string;
    category_name?: string;
    category_id?: string;
    approved: boolean;
}

interface Props {
    budgetUuid: string;
    categories: Category[];
    uncategorizedTransactions: SuggestedTransaction[];
    unapprovedTransactions: UnapprovedTransaction[];
}

type TabType = 'uncategorized' | 'unapproved';

export default function TransactionsPageWithTabs({
    budgetUuid,
    categories,
    uncategorizedTransactions,
    unapprovedTransactions
}: Props) {
    const [activeTab, setActiveTab] = useState<TabType>('uncategorized');

    const uncategorizedCount = uncategorizedTransactions.length;
    const unapprovedCount = unapprovedTransactions.length;
    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-2">
                <div className="flex gap-2">
                    <button
                        className={`inline-flex items-center gap-3 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative ${activeTab === 'uncategorized'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 shadow-sm'
                            : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
                            }`}
                        onClick={() => setActiveTab('uncategorized')}
                    >
                        <span className="text-lg">📝</span>
                        <span>Uncategorized</span>
                        {uncategorizedCount > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-red-100 text-red-800 rounded-full dark:bg-red-900/20 dark:text-red-300">
                                {uncategorizedCount}
                            </span>
                        )}

                        {/* Active indicator */}
                        {activeTab === 'uncategorized' && (
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full"></div>
                        )}
                    </button>

                    <button
                        className={`inline-flex items-center gap-3 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative ${activeTab === 'unapproved'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 shadow-sm'
                            : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
                            }`}
                        onClick={() => setActiveTab('unapproved')}
                    >
                        <span className="text-lg">⏳</span>
                        <span>Unapproved</span>
                        {unapprovedCount > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full dark:bg-amber-900/20 dark:text-amber-300">
                                {unapprovedCount}
                            </span>
                        )}

                        {/* Active indicator */}
                        {activeTab === 'unapproved' && (
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full"></div>
                        )}
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div >
                {activeTab === 'uncategorized' && (
                    <UncategorisedTransactionsContent
                        budgetUuid={budgetUuid}
                        categories={categories}
                        initialTransactions={uncategorizedTransactions}
                    />
                )}

                {activeTab === 'unapproved' && (
                    <UnapprovedTransactionsContent
                        budgetUuid={budgetUuid}
                        categories={categories}
                        initialTransactions={unapprovedTransactions}
                    />
                )}
            </div>
        </div>
    );
}