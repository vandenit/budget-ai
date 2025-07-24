import React, { useState } from 'react';

interface AmountInputProps {
    value: number;
    onChange: (value: number) => void;
    placeholder?: string;
    required?: boolean;
    className?: string;
    showToggle?: boolean; // Show income/expense toggle buttons
}

export const AmountInput: React.FC<AmountInputProps> = ({
    value,
    onChange,
    placeholder = "0.00",
    required = false,
    className = "",
    showToggle = true
}) => {
    const [isExpense, setIsExpense] = useState(value < 0);
    const absoluteValue = Math.abs(value);

    const handleAmountChange = (newAmount: number) => {
        const finalAmount = isExpense ? -Math.abs(newAmount) : Math.abs(newAmount);
        onChange(finalAmount);
    };

    const handleToggle = (expense: boolean) => {
        setIsExpense(expense);
        if (value !== 0) {
            onChange(expense ? -Math.abs(value) : Math.abs(value));
        }
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {showToggle && (
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => handleToggle(false)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            !isExpense
                                ? 'bg-green-100 text-green-800 border-2 border-green-300 hover:bg-green-200 focus:ring-green-500 dark:bg-green-900 dark:text-green-200 dark:border-green-700 dark:hover:bg-green-800'
                                : 'bg-gray-100 text-gray-600 border-2 border-gray-200 hover:bg-gray-200 focus:ring-gray-500 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700'
                        }`}
                    >
                        💰 Income
                    </button>
                    <button
                        type="button"
                        onClick={() => handleToggle(true)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            isExpense
                                ? 'bg-red-100 text-red-800 border-2 border-red-300 hover:bg-red-200 focus:ring-red-500 dark:bg-red-900 dark:text-red-200 dark:border-red-700 dark:hover:bg-red-800'
                                : 'bg-gray-100 text-gray-600 border-2 border-gray-200 hover:bg-gray-200 focus:ring-gray-500 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700'
                        }`}
                    >
                        💸 Expense
                    </button>
                </div>
            )}
            
            <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium pointer-events-none">
                    €
                </div>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={absoluteValue || ''}
                    onChange={(e) => handleAmountChange(Number(e.target.value))}
                    className={`input input-bordered w-full pl-10 pr-4 ${
                        isExpense
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                    }`}
                    placeholder={placeholder}
                    required={required}
                    inputMode="decimal"
                />
            </div>
        </div>
    );
};
