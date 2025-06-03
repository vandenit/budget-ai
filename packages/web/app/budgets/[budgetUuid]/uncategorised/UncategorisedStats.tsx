"use client";

interface Props {
    totalTransactions: number;
    aiSuggestionsCount: number;
    manuallyModifiedCount: number;
    onApplyAll: () => void;
    onApplyAIOnly: () => void;
    isApplying: boolean;
    lastResult?: any;
}

export default function UncategorisedStats({
    totalTransactions,
    aiSuggestionsCount,
    manuallyModifiedCount,
    onApplyAll,
    onApplyAIOnly,
    isApplying,
    lastResult
}: Props) {
    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="stats stats-horizontal shadow">
                        <div className="stat">
                            <div className="stat-figure text-primary">
                                <span className="text-3xl">📝</span>
                            </div>
                            <div className="stat-title">Uncategorised</div>
                            <div className="stat-value text-primary">{totalTransactions}</div>
                            <div className="stat-desc">
                                {totalTransactions === 0 ? 'All done!' : 'Transactions need attention'}
                            </div>
                        </div>

                        {totalTransactions > 0 && (
                            <>
                                <div className="stat">
                                    <div className="stat-figure text-blue-500">
                                        <span className="text-2xl">🤖</span>
                                    </div>
                                    <div className="stat-title">AI Suggestions</div>
                                    <div className="stat-value text-blue-500">{aiSuggestionsCount}</div>
                                    <div className="stat-desc">Ready to apply</div>
                                </div>

                                <div className="stat">
                                    <div className="stat-figure text-orange-500">
                                        <span className="text-2xl">✏️</span>
                                    </div>
                                    <div className="stat-title">Manual Changes</div>
                                    <div className="stat-value text-orange-500">{manuallyModifiedCount}</div>
                                    <div className="stat-desc">Your modifications</div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        {totalTransactions > 0 && (
                            <>
                                <button
                                    className="btn btn-primary btn-lg gap-2"
                                    onClick={onApplyAll}
                                    disabled={isApplying}
                                >
                                    {isApplying ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            Applying All Changes...
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-xl">🎯</span>
                                            Apply All ({totalTransactions})
                                        </>
                                    )}
                                </button>

                                {aiSuggestionsCount > 0 && (
                                    <button
                                        className="btn btn-outline btn-primary gap-2"
                                        onClick={onApplyAIOnly}
                                        disabled={isApplying}
                                    >
                                        <span className="text-xl">🤖</span>
                                        Apply AI Only ({aiSuggestionsCount})
                                    </button>
                                )}
                            </>
                        )}

                        {lastResult && !lastResult.error && (
                            <div className="badge badge-success gap-2">
                                <span>✅</span>
                                {lastResult.updated_transactions?.length || lastResult.length} applied
                            </div>
                        )}
                    </div>
                </div>

                {totalTransactions > 0 && (
                    <div className="mt-4 text-sm text-gray-600">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <p>
                                    <span className="badge badge-outline badge-primary mr-2">🤖 AI</span>
                                    <strong>AI suggestions</strong> are based on your past categorizations.
                                </p>
                            </div>
                            <div>
                                <p>
                                    <span className="badge badge-outline badge-warning mr-2">✏️ Manual</span>
                                    <strong>Manual changes</strong> will be learned for future suggestions.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 