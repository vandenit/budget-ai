import React from 'react';
import { FaSearch, FaSort, FaExclamationTriangle, FaPencilAlt, FaRobot, FaClock } from 'react-icons/fa';

// Filter types for different transaction views
export type FilterType = 'all' | 'uncategorized' | 'manual_edit' | 'ai_suggestions' | 'categorized' | 'pending';

export type SortType =
  | 'needs_attention_first'
  | 'amount_desc'
  | 'date_newest'
  | 'payee_name'
  | 'uncategorized_first';

interface FilterOption {
  value: FilterType;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  variant?: 'primary' | 'warning' | 'info' | 'success' | 'error';
}

interface SortOption {
  value: SortType;
  label: string;
  emoji?: string;
}

interface TransactionFiltersProps {
  // Search
  searchTerm: string;
  onSearchChange: (term: string) => void;
  searchPlaceholder?: string;

  // Filters
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  filterOptions: FilterOption[];

  // Sorting
  sortBy: SortType;
  onSortChange: (sort: SortType) => void;
  sortOptions: SortOption[];

  // Results info
  totalCount: number;
  filteredCount: number;

  // Styling
  className?: string;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search transactions...",
  activeFilter,
  onFilterChange,
  filterOptions,
  sortBy,
  onSortChange,
  sortOptions,
  totalCount,
  filteredCount,
  className = ''
}) => {
  const getFilterButtonClass = (option: FilterOption) => {
    const baseClass = 'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200';
    const isActive = activeFilter === option.value;

    if (isActive) {
      switch (option.variant) {
        case 'warning': return `${baseClass} bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800`;
        case 'info': return `${baseClass} bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800`;
        case 'success': return `${baseClass} bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800`;
        case 'error': return `${baseClass} bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800`;
        default: return `${baseClass} bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700`;
      }
    } else {
      return `${baseClass} bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200`;
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 ${className}`}>
      <div className="p-5">
        {/* Search and Controls Row */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">

          {/* Search Input */}
          <div className="flex-1 w-full lg:max-w-md">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="input input-bordered w-full pl-10"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                className={getFilterButtonClass(option)}
                onClick={() => onFilterChange(option.value)}
                title={option.label}
              >
                {option.icon}
                <span className="hidden sm:inline">
                  {option.label}
                </span>
                {option.count !== undefined && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-white/80 text-slate-700 rounded-full dark:bg-slate-700/80 dark:text-slate-300">
                    {option.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-outline btn-sm gap-2">
              <FaSort />
              <span className="hidden sm:inline">Sort</span>
            </div>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-64">
              {sortOptions.map((option) => (
                <li key={option.value}>
                  <button
                    className={sortBy === option.value ? 'active' : ''}
                    onClick={() => onSortChange(option.value)}
                  >
                    {option.emoji && <span>{option.emoji}</span>}
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Active Filters and Results Info */}
        {(searchTerm || activeFilter !== 'all') && (
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-600">Active filters:</span>

            {/* Search term badge */}
            {searchTerm && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                <FaSearch className="w-3 h-3" />
                &quot;{searchTerm}&quot;
                <button
                  className="ml-1 text-xs hover:text-red-500 transition-colors"
                  onClick={() => onSearchChange('')}
                  title="Clear search"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Active filter badge */}
            {activeFilter !== 'all' && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                {filterOptions.find(opt => opt.value === activeFilter)?.label ?? activeFilter}
                <button
                  className="ml-1 text-xs hover:text-red-500 transition-colors"
                  onClick={() => onFilterChange('all')}
                  title="Clear filter"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Results count */}
            <span className="text-sm text-gray-500">
              ({filteredCount} of {totalCount} transactions)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Predefined filter configurations for common use cases
export const uncategorizedFilters: FilterOption[] = [
  { value: 'all', label: 'All', variant: 'primary' },
  {
    value: 'uncategorized',
    label: 'Uncategorized',
    icon: <FaExclamationTriangle className="w-3 h-3" />,
    variant: 'warning'
  },
  {
    value: 'manual_edit',
    label: 'Manual',
    icon: <FaPencilAlt className="w-3 h-3" />,
    variant: 'info'
  },
  {
    value: 'ai_suggestions',
    label: 'AI suggestions',
    icon: <FaRobot className="w-3 h-3" />,
    variant: 'success'
  }
];

export const unapprovedFilters: FilterOption[] = [
  { value: 'all', label: 'All', variant: 'primary' },
  { value: 'categorized', label: 'Categorized', variant: 'success' },
  { value: 'uncategorized', label: 'Uncategorized', variant: 'warning' }
];

export const uncategorizedSortOptions: SortOption[] = [
  { value: 'needs_attention_first', label: 'Needs attention first', emoji: '🚨' },
  { value: 'amount_desc', label: 'Amount (high → low)', emoji: '💰' },
  { value: 'date_newest', label: 'Date (newest → oldest)', emoji: '📅' },
  { value: 'payee_name', label: 'Payee (A-Z)', emoji: '🏪' }
];

export const unapprovedSortOptions: SortOption[] = [
  { value: 'uncategorized_first', label: 'Uncategorized first', emoji: '🚨' },
  { value: 'amount_desc', label: 'Amount (high → low)', emoji: '💰' },
  { value: 'date_newest', label: 'Date (newest → oldest)', emoji: '📅' },
  { value: 'payee_name', label: 'Payee (A-Z)', emoji: '🏪' }
];
