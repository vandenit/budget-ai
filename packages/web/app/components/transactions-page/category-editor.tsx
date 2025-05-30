"use client";

import React, { useState } from 'react';
import { Category } from 'common-ts';
import { FaCheck, FaTimes, FaEdit } from 'react-icons/fa';

interface CategoryEditorProps {
  // Current category information
  currentCategoryName?: string;
  currentCategoryId?: string;
  
  // Available categories
  categories: Category[];
  
  // Callbacks
  onSave: (categoryId: string, categoryName: string) => Promise<void>;
  onCancel?: () => void;
  
  // Display options
  showEditButton?: boolean;
  placeholder?: string;
  className?: string;
  
  // Loading state
  isLoading?: boolean;
  
  // Size variants
  size?: 'sm' | 'md' | 'lg';
}

export const CategoryEditor: React.FC<CategoryEditorProps> = ({
  currentCategoryName,
  currentCategoryId,
  categories,
  onSave,
  onCancel,
  showEditButton = true,
  placeholder = "Select category",
  className = '',
  isLoading = false,
  size = 'sm'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(currentCategoryId || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEdit = () => {
    setIsEditing(true);
    setSelectedCategoryId(currentCategoryId || '');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedCategoryId(currentCategoryId || '');
    onCancel?.();
  };

  const handleSave = async () => {
    if (!selectedCategoryId) return;
    
    const selectedCategory = categories.find(c => c._id === selectedCategoryId || c.uuid === selectedCategoryId);
    if (!selectedCategory) return;

    setIsSaving(true);
    try {
      await onSave(selectedCategoryId, selectedCategory.name);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving category:', error);
      // Keep editing mode open on error
    } finally {
      setIsSaving(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'lg':
        return 'text-base px-4 py-2';
      case 'md':
        return 'text-sm px-3 py-2';
      case 'sm':
      default:
        return 'text-xs px-2.5 py-1.5';
    }
  };

  const getButtonSizeClasses = () => {
    switch (size) {
      case 'lg':
        return 'w-8 h-8';
      case 'md':
        return 'w-7 h-7';
      case 'sm':
      default:
        return 'w-6 h-6';
    }
  };

  if (isLoading) {
    return (
      <div className={`inline-flex items-center gap-2 ${getSizeClasses()} ${className}`}>
        <span className="loading loading-dots loading-sm"></span>
        <span className="text-slate-500">Loading...</span>
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {currentCategoryName ? (
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 ${getSizeClasses()}`}>
            {currentCategoryName}
          </span>
        ) : (
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-50 text-gray-500 border border-gray-200 dark:bg-gray-900 dark:text-gray-500 dark:border-gray-700 ${getSizeClasses()}`}>
            No category
          </span>
        )}
        
        {showEditButton && (
          <button
            onClick={handleStartEdit}
            className={`inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors ${getButtonSizeClasses()}`}
            title="Edit category"
          >
            <FaEdit className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <select
        value={selectedCategoryId}
        onChange={(e) => setSelectedCategoryId(e.target.value)}
        className={`rounded-lg border border-slate-300 bg-white text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:focus:border-blue-400 ${getSizeClasses()}`}
        disabled={isSaving}
      >
        <option value="">{placeholder}</option>
        {categories.map((category) => (
          <option key={category._id || category.uuid} value={category._id || category.uuid}>
            {category.name}
          </option>
        ))}
      </select>
      
      <button
        onClick={handleSave}
        disabled={!selectedCategoryId || isSaving}
        className={`inline-flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 transition-colors ${getButtonSizeClasses()}`}
        title="Save category"
      >
        {isSaving ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : (
          <FaCheck className="w-3 h-3" />
        )}
      </button>
      
      <button
        onClick={handleCancel}
        disabled={isSaving}
        className={`inline-flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors ${getButtonSizeClasses()}`}
        title="Cancel"
      >
        <FaTimes className="w-3 h-3" />
      </button>
    </div>
  );
};

export default CategoryEditor;
