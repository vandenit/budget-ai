import React from 'react';
import { TransactionAmount } from './transaction-amount';
import { TransactionBadge, CategoryBadge, BadgeType } from './transaction-badge';
import { FaEdit, FaTrash, FaCheck } from 'react-icons/fa';

// Base transaction interface that all transaction types should extend
export interface BaseTransaction {
  amount: number;
  payee_name?: string;
  payeeName?: string;
  date: string;
  memo?: string;
}

// Props for the transaction card component
interface TransactionCardProps<T extends BaseTransaction> {
  transaction: T;

  // Display options
  showCategory?: boolean;
  showActions?: boolean;
  showMemo?: boolean;

  // Category information
  categoryName?: string;
  categoryBadgeProps?: {
    isManuallyModified?: boolean;
    isUncategorized?: boolean;
    isCached?: boolean;
  };

  // Status badges
  statusBadge?: {
    type: BadgeType;
    text?: string;
  };

  // Actions
  onEdit?: () => void;
  onRemove?: () => void;
  onApply?: () => void;

  // Loading states
  isApplying?: boolean;
  isEditing?: boolean;

  // Styling
  className?: string;
  variant?: 'default' | 'attention' | 'modified' | 'success';
}

export function TransactionCard<T extends BaseTransaction>({
  transaction,
  showCategory = true,
  showActions = false,
  showMemo = true,
  categoryName,
  categoryBadgeProps,
  statusBadge,
  onEdit,
  onRemove,
  onApply,
  isApplying = false,
  isEditing = false,
  className = '',
  variant = 'default'
}: TransactionCardProps<T>) {

  const getVariantClasses = () => {
    switch (variant) {
      case 'attention':
        return 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200 dark:from-red-900/10 dark:to-rose-900/10 dark:border-red-800 border-l-4 border-l-red-500 shadow-sm';
      case 'modified':
        return 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 dark:from-amber-900/10 dark:to-orange-900/10 dark:border-amber-800 shadow-sm';
      case 'success':
        return 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 dark:from-emerald-900/10 dark:to-green-900/10 dark:border-emerald-800 shadow-sm';
      default:
        return 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-200';
    }
  };

  const payeeName = transaction.payee_name || transaction.payeeName || 'Unknown Payee';

  return (
    <div
      className={`flex flex-col lg:flex-row justify-between items-start lg:items-center p-4 rounded-lg border gap-4 ${getVariantClasses()} ${className}`}
    >
      {/* Left section - Payee and badges */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
          <div className="font-semibold text-lg dark:text-white truncate">
            {payeeName}
          </div>

          {/* Status badge */}
          {statusBadge && (
            <TransactionBadge
              type={statusBadge.type}
              text={statusBadge.text}
              className="flex-shrink-0"
            />
          )}
        </div>

        {/* Transaction ID or memo */}
        {showMemo && transaction.memo && (
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {transaction.memo}
          </div>
        )}
      </div>

      {/* Right section - Category, Amount, Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">

        {/* Category section */}
        {showCategory && (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium whitespace-nowrap">Category:</span>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <span className="loading loading-dots loading-sm"></span>
                <span className="text-sm text-gray-500">Editing...</span>
              </div>
            ) : categoryName ? (
              <CategoryBadge
                categoryName={categoryName}
                {...categoryBadgeProps}
                className="flex-shrink-0"
              />
            ) : (
              <TransactionBadge
                type="no-suggestion"
                className="flex-shrink-0"
              />
            )}
          </div>
        )}

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <TransactionAmount amount={transaction.amount} />
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 flex-shrink-0">
            {onEdit && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={onEdit}
                title="Edit category"
                disabled={isApplying}
              >
                <FaEdit />
              </button>
            )}

            {onApply && categoryName && (
              <button
                className="btn btn-success btn-sm gap-1"
                onClick={onApply}
                disabled={isApplying}
                title="Apply category"
              >
                {isApplying ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Applying...
                  </>
                ) : (
                  <>
                    <FaCheck className="w-3 h-3" />
                    Apply
                  </>
                )}
              </button>
            )}

            {onRemove && (
              <button
                className="btn btn-error btn-sm"
                onClick={onRemove}
                title="Remove from list"
                disabled={isApplying}
              >
                <FaTrash />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
