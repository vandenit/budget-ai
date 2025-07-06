"use client";

import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { Category, FormField, NumberInput, TextInput, DateInput, SelectInput } from 'common-ts';
import { ScheduledTransactionUpdate, ScheduledTransactionCreate } from '../../../api/scheduledTransactions.client';
import { Account } from '../../../api/accounts.server';

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
    accounts: Account[];
    budgetUuid: string;
    transaction?: TransactionData;
    mode?: 'edit' | 'create';
};

// Custom hook for form state management
const useTransactionForm = (transaction?: TransactionData, mode: 'edit' | 'create' = 'edit') => {
    // Initialize with transaction data or defaults
    const initialData = mode === 'edit' && transaction ? {
        amount: transaction.amount,
        categoryId: transaction.categoryId,
        date: transaction.date,
        payeeName: transaction.payeeName || '',
        memo: transaction.memo || '',
        accountId: transaction.accountId || '',
    } : {
        amount: 0,
        categoryId: '',
        date: new Date().toISOString().split('T')[0],
        payeeName: '',
        memo: '',
        accountId: '',
    };

    const [formData, setFormData] = useState<TransactionData>(initialData);

    const updateField = (field: keyof TransactionData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setFormData(initialData);
    };

    return { formData, updateField, resetForm };
};

export const EditTransactionDialog = ({ isOpen, onClose, onSave, onCreate, categories, accounts, budgetUuid, transaction, mode = 'edit' }: Props) => {
    const { formData, updateField, resetForm } = useTransactionForm(transaction, mode);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    // Set first account as default for create mode when dialog opens
    useEffect(() => {
        if (isOpen && mode === 'create' && accounts.length > 0 && !formData.accountId) {
            updateField('accountId', accounts[0].uuid);
        }
        if (isOpen) {
            setError('');
        }
    }, [isOpen, mode, accounts, formData.accountId, updateField]);

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
                    payeeName: formData.payeeName,
                    memo: formData.memo,
                    accountId: formData.accountId,
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