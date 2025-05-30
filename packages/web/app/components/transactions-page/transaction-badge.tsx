import React from 'react';
import { FaRobot, FaPencilAlt, FaExclamationTriangle, FaClock } from 'react-icons/fa';

export type BadgeType =
  | 'ai-cached'
  | 'ai-generated'
  | 'ai-uncategorized'
  | 'manual-edit'
  | 'uncategorized'
  | 'loading'
  | 'no-suggestion'
  | 'approved'
  | 'pending-approval';

interface TransactionBadgeProps {
  type: BadgeType;
  text?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const TransactionBadge: React.FC<TransactionBadgeProps> = ({
  type,
  text,
  className = '',
  size = 'sm'
}) => {
  const getBadgeConfig = () => {
    switch (type) {
      case 'ai-cached':
        return {
          className: 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
          icon: <FaRobot className="w-3 h-3" />,
          defaultText: 'AI (Cached)',
          textColor: ''
        };
      case 'ai-generated':
        return {
          className: 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
          icon: <FaRobot className="w-3 h-3" />,
          defaultText: 'AI (Generated)',
          textColor: ''
        };
      case 'ai-uncategorized':
        return {
          className: 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
          icon: <FaRobot className="w-3 h-3" />,
          defaultText: 'AI (Uncategorized)',
          textColor: ''
        };
      case 'manual-edit':
        return {
          className: 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
          icon: <FaPencilAlt className="w-3 h-3" />,
          defaultText: 'Manual Edit',
          textColor: ''
        };
      case 'uncategorized':
        return {
          className: 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
          icon: <FaExclamationTriangle className="w-3 h-3" />,
          defaultText: 'Uncategorized',
          textColor: ''
        };
      case 'loading':
        return {
          className: 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
          icon: <span className="loading loading-spinner loading-xs"></span>,
          defaultText: 'Loading...',
          textColor: ''
        };
      case 'no-suggestion':
        return {
          className: 'bg-gray-50 text-gray-500 border border-gray-200 dark:bg-gray-900 dark:text-gray-500 dark:border-gray-700',
          icon: <FaExclamationTriangle className="w-3 h-3" />,
          defaultText: 'No Suggestion',
          textColor: ''
        };
      case 'approved':
        return {
          className: 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
          icon: null,
          defaultText: 'Approved',
          textColor: ''
        };
      case 'pending-approval':
        return {
          className: 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
          icon: <FaClock className="w-3 h-3" />,
          defaultText: 'Pending',
          textColor: ''
        };
      default:
        return {
          className: 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
          icon: null,
          defaultText: 'Unknown',
          textColor: ''
        };
    }
  };

  const config = getBadgeConfig();
  const displayText = text || config.defaultText;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.className} ${className}`}
      title={displayText}
    >
      {config.icon}
      <span className="truncate max-w-24 sm:max-w-32 md:max-w-none">
        {displayText}
      </span>
    </span>
  );
};

// Category badge for displaying category names
interface CategoryBadgeProps {
  categoryName: string;
  isManuallyModified?: boolean;
  isUncategorized?: boolean;
  isCached?: boolean;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  categoryName,
  isManuallyModified = false,
  isUncategorized = false,
  isCached = false,
  className = '',
  size = 'sm'
}) => {
  const getBadgeClass = () => {
    if (isManuallyModified) return 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800';
    if (isUncategorized) return 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
    if (isCached) return 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800';
    return 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getBadgeClass()} ${className}`}
      title={categoryName}
    >
      <span className="truncate max-w-24 sm:max-w-32 md:max-w-none">
        {categoryName}
      </span>
    </span>
  );
};
