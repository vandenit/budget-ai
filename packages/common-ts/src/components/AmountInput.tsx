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
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            !isExpense
                                ? 'bg-green-100 text-green-800 border-2 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700'
                                : 'bg-gray-100 text-gray-600 border-2 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700'
                        }`}
                    >
                        💰 Income
                    </button>
                    <button
                        type="button"
                        onClick={() => handleToggle(true)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isExpense
                                ? 'bg-red-100 text-red-800 border-2 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700'
                                : 'bg-gray-100 text-gray-600 border-2 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700'
                        }`}
                    >
                        💸 Expense
                    </button>
                </div>
            )}
            
            <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                    €
                </div>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={absoluteValue || ''}
                    onChange={(e) => handleAmountChange(Number(e.target.value))}
                    className="input input-bordered w-full pl-8 pr-4"
                    placeholder={placeholder}
                    required={required}
                    inputMode="decimal"
                />
                {showToggle && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <span className={`text-sm font-medium ${
                            isExpense ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                        }`}>
                            {isExpense ? '−' : '+'}
                        </span>
                    </div>
                )}
            </div>
            
            {/* Quick amount buttons for mobile */}
            <div className="grid grid-cols-4 gap-2 sm:hidden">
                {[10, 25, 50, 100].map((amount) => (
                    <button
                        key={amount}
                        type="button"
                        onClick={() => handleAmountChange(amount)}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded border text-gray-700 dark:text-gray-300"
                    >
                        €{amount}
                    </button>
                ))}
            </div>
        </div>
    );
};
