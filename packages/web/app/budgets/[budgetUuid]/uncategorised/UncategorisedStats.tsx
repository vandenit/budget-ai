"use client";

interface Props {
    totalTransactions: number;
    onApplyAll: () => void;
    isApplying: boolean;
    lastResult?: any;
}

export default function UncategorisedStats({
    totalTransactions,
    onApplyAll,
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
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        {totalTransactions > 0 && (
                            <button
                                className="btn btn-primary btn-lg gap-2"
                                onClick={onApplyAll}
                                disabled={isApplying}
                            >
                                {isApplying ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Applying AI Suggestions...
                                    </>
                                ) : (
                                    <>
                                        <span className="text-xl">🤖</span>
                                        Apply All AI Suggestions
                                    </>
                                )}
                            </button>
                        )}

                        {lastResult && !lastResult.error && (
                            <div className="badge badge-success gap-2">
                                <span>✅</span>
                                {lastResult.length} applied
                            </div>
                        )}
                    </div>
                </div>

                {totalTransactions > 0 && (
                    <div className="mt-4 text-sm text-gray-600">
                        <p>
                            💡 <strong>AI suggestions</strong> are based on your past categorizations.
                            Review them before applying, or manually adjust any category.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
} 