"use client";

import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { Category } from 'common-ts';
import { ScheduledTransactionUpdate, ScheduledTransactionCreate } from '../../../api/scheduledTransactions.client';
import { Account, getAccounts } from '../../../api/accounts.client';

// Reusable form field components
const FormField = ({
    label,
    required = false,
    children
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) => (
    <div className="form-control">
        <label className="label">
            <span className="label-text">
                {label} {required && <span className="text-error">*</span>}
            </span>
        </label>
        {children}
    </div>
);

const NumberInput = ({
    value,
    onChange,
    placeholder,
    required = false
}: {
    value: number;
    onChange: (value: number) => void;
    placeholder?: string;
    required?: boolean;
}) => (
    <input
        type="number"
        step="0.01"
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="input input-bordered w-full"
        placeholder={placeholder}
        required={required}
    />
);

const TextInput = ({
    value,
    onChange,
    placeholder,
    required = false
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
}) => (
    <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input input-bordered w-full"
        placeholder={placeholder}
        required={required}
    />
);

const DateInput = ({
    value,
    onChange,
    required = false
}: {
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
}) => (
    <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input input-bordered w-full"
        required={required}
    />
);

const SelectInput = ({
    value,
    onChange,
    options,
    placeholder,
    required = false
}: {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    required?: boolean;
}) => (
    <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="select select-bordered w-full"
        required={required}
    >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
            <option key={option.value} value={option.value}>
                {option.label}
            </option>
        ))}
    </select>
);

type TransactionData = {
    amount: number;
    categoryId: string;
    date: string;
    payeeName?: string;
    memo?: string;
    accountId?: string;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (updates: ScheduledTransactionUpdate) => Promise<void>;
    onCreate?: (data: ScheduledTransactionCreate) => Promise<void>;
    categories: Category[];
    budgetUuid: string;
    transaction?: TransactionData;
    mode?: 'edit' | 'create';
};

// Custom hook for form state management
const useTransactionForm = (transaction?: TransactionData, mode: 'edit' | 'create' = 'edit') => {
    const [formData, setFormData] = useState<TransactionData>({
        amount: 0,
        categoryId: '',
        date: new Date().toISOString().split('T')[0],
        payeeName: '',
        memo: '',
        accountId: '',
    });

    const updateField = (field: keyof TransactionData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        if (mode === 'edit' && transaction) {
            setFormData({
                amount: transaction.amount,
                categoryId: transaction.categoryId,
                date: transaction.date,
                payeeName: transaction.payeeName || '',
                memo: transaction.memo || '',
                accountId: transaction.accountId || '',
            });
        } else {
            setFormData({
                amount: 0,
                categoryId: '',
                date: new Date().toISOString().split('T')[0],
                payeeName: '',
                memo: '',
                accountId: '',
            });
        }
    };

    return { formData, updateField, resetForm };
};

export const EditTransactionDialog = ({ isOpen, onClose, onSave, onCreate, categories, budgetUuid, transaction, mode = 'edit' }: Props) => {
    const { formData, updateField, resetForm } = useTransactionForm(transaction, mode);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    // Load accounts and reset form when dialog opens
    useEffect(() => {
        if (!isOpen) return;

        const initializeDialog = async () => {
            // Reset form data
            resetForm();
            setError('');

            // Load accounts for both modes
            try {
                const accountsData = await getAccounts(budgetUuid);
                setAccounts(accountsData);
                // Set first account as default only for create mode
                if (mode === 'create' && accountsData.length > 0) {
                    updateField('accountId', accountsData[0].uuid);
                }
            } catch (error) {
                console.error('Failed to load accounts:', error);
                setError('Failed to load accounts');
            }
        };

        initializeDialog();
    }, [isOpen, mode, budgetUuid, transaction, resetForm, updateField]);

    const validateForm = (): string | null => {
        if (!formData.amount || !formData.categoryId || !formData.date) {
            return 'Please fill in all required fields';
        }
        if (mode === 'create' && !formData.accountId) {
            return 'Please select an account';
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSaving(true);

        try {
            const validationError = validateForm();
            if (validationError) {
                setError(validationError);
                return;
            }

            if (mode === 'create' && onCreate) {
                await onCreate({
                    amount: formData.amount,
                    categoryId: formData.categoryId,
                    date: formData.date,
                    payeeName: formData.payeeName || undefined,
                    memo: formData.memo || undefined,
                    accountId: formData.accountId!,
                });
            } else if (mode === 'edit' && onSave) {
                await onSave({
                    amount: formData.amount,
                    categoryId: formData.categoryId,
                    date: formData.date,
                });
            } else {
                setError('Invalid operation mode');
                return;
            }
            onClose();
        } catch (err) {
            setError(mode === 'create' ? 'Failed to create transaction' : 'Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-base-100 rounded-lg w-full max-w-md relative max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 pb-4 border-b border-base-200">
                    <h3 className="text-lg font-bold">
                        {mode === 'create' ? 'Add Scheduled Transaction' : 'Edit Transaction'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="btn btn-ghost btn-sm"
                        type="button"
                    >
                        <FiX className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 pt-4">
                <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
                    <FormField label="Amount" required>
                        <NumberInput
                            value={formData.amount}
                            onChange={(value) => updateField('amount', value)}
                            placeholder="0.00"
                            required
                        />
                    </FormField>

                    <FormField label="Category" required>
                        <SelectInput
                            value={formData.categoryId}
                            onChange={(value) => updateField('categoryId', value)}
                            options={categories.map(cat => ({ value: cat.uuid, label: cat.name }))}
                            placeholder="Select a category"
                            required
                        />
                    </FormField>

                    <FormField label="Date" required>
                        <DateInput
                            value={formData.date}
                            onChange={(value) => updateField('date', value)}
                            required
                        />
                    </FormField>

                    <FormField label="Account" required={mode === 'create'}>
                        <SelectInput
                            value={formData.accountId || ''}
                            onChange={(value) => updateField('accountId', value)}
                            options={accounts.map(acc => ({ value: acc.uuid, label: acc.name }))}
                            placeholder="Select an account"
                            required={mode === 'create'}
                        />
                    </FormField>

                    <FormField label="Payee">
                        <TextInput
                            value={formData.payeeName || ''}
                            onChange={(value) => updateField('payeeName', value)}
                            placeholder="Enter payee name"
                        />
                    </FormField>

                    <FormField label="Memo">
                        <TextInput
                            value={formData.memo || ''}
                            onChange={(value) => updateField('memo', value)}
                            placeholder="Enter memo"
                        />
                    </FormField>

                    {error && (
                        <div className="alert alert-error">
                            <span>{error}</span>
                        </div>
                    )}
                </form>
                </div>

                <div className="border-t border-base-200 p-6 pt-4">
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-ghost"
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="transaction-form"
                            className="btn btn-primary"
                            disabled={isSaving}
                        >
                            {isSaving
                                ? (mode === 'create' ? 'Creating...' : 'Saving...')
                                : (mode === 'create' ? 'Create Transaction' : 'Save Changes')
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}; 