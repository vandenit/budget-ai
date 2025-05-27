"use client";

import React, { useState } from 'react';
import { Category } from 'common-ts';
import UncategorisedTransactionsContent from './UncategorisedTransactionsContent';
import UnapprovedTransactionsContent from './UnapprovedTransactionsContent';
import { SuggestedTransaction } from './UncategorisedTransactionsContent';

interface UnapprovedTransaction {
    transaction_id: string;
    payee_name: string;
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
            <div className="tabs tabs-boxed bg-base-200 p-1">
                <button
                    className={`tab tab-lg ${activeTab === 'uncategorized' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('uncategorized')}
                >
                    <span className="flex items-center gap-2">
                        <span className="text-xl">📝</span>
                        <span>Uncategorized</span>
                        {uncategorizedCount > 0 && (
                            <div className="badge badge-primary">
                                {uncategorizedCount}
                            </div>
                        )}
                    </span>
                </button>

                <button
                    className={`tab tab-lg ${activeTab === 'unapproved' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('unapproved')}
                >
                    <span className="flex items-center gap-2">
                        <span className="text-xl">⏳</span>
                        <span>Unapproved</span>
                        {unapprovedCount > 0 && (
                            <div className="badge badge-warning">
                                {unapprovedCount}
                            </div>
                        )}
                    </span>
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
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