"use client";

interface Props {
    totalTransactions: number;
    categorizedCount: number;
    uncategorizedCount: number;
    onApproveAll: () => void;
    isApproving: boolean;
    lastResult?: any;
}

export default function UnapprovedStats({
    totalTransactions,
    categorizedCount,
    uncategorizedCount,
    onApproveAll,
    isApproving,
    lastResult
}: Props) {
    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="stats stats-horizontal shadow">
                        <div className="stat">
                            <div className="stat-figure text-warning">
                                <span className="text-3xl">⏳</span>
                            </div>
                            <div className="stat-title">Unapproved</div>
                            <div className="stat-value text-warning">{totalTransactions}</div>
                            <div className="stat-desc">
                                {totalTransactions === 0 ? 'All approved!' : 'Transactions need approval'}
                            </div>
                        </div>

                        {totalTransactions > 0 && (
                            <>
                                <div className="stat">
                                    <div className="stat-figure text-success">
                                        <span className="text-2xl">✅</span>
                                    </div>
                                    <div className="stat-title">Categorized</div>
                                    <div className="stat-value text-success">{categorizedCount}</div>
                                    <div className="stat-desc">Ready to approve</div>
                                </div>

                                <div className="stat">
                                    <div className="stat-figure text-orange-500">
                                        <span className="text-2xl">❓</span>
                                    </div>
                                    <div className="stat-title">Uncategorized</div>
                                    <div className="stat-value text-orange-500">{uncategorizedCount}</div>
                                    <div className="stat-desc">Need categorization</div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        {totalTransactions > 0 && (
                            <button
                                className="btn btn-success btn-lg gap-2"
                                onClick={onApproveAll}
                                disabled={isApproving}
                            >
                                {isApproving ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Approving All...
                                    </>
                                ) : (
                                    <>
                                        <span className="text-xl">✅</span>
                                        Approve All ({totalTransactions})
                                    </>
                                )}
                            </button>
                        )}

                        {lastResult && !lastResult.error && (
                            <div className="badge badge-success gap-2">
                                <span>✅</span>
                                {lastResult.approved_count} approved
                            </div>
                        )}
                    </div>
                </div>

                {totalTransactions > 0 && (
                    <div className="mt-4 text-sm text-gray-600">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <p>
                                    <span className="badge badge-outline badge-success mr-2">✅ Approve</span>
                                    <strong>Approve transactions</strong> that are already categorized correctly.
                                </p>
                            </div>
                            <div>
                                <p>
                                    <span className="badge badge-outline badge-info mr-2">📝 Edit</span>
                                    <strong>Change category</strong> and approve in one action.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 