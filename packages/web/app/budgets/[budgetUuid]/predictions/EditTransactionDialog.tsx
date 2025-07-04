"use client";

import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { Category } from 'common-ts';
import { ScheduledTransactionUpdate, ScheduledTransactionCreate } from '../../../api/scheduledTransactions.client';
import { Account, getAccounts } from '../../../api/accounts.client';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (updates: ScheduledTransactionUpdate) => Promise<void>;
    onCreate?: (data: ScheduledTransactionCreate) => Promise<void>;
    categories: Category[];
    budgetUuid: string;
    transaction?: {
        amount: number;
        categoryId: string;
        date: string;
    };
    mode?: 'edit' | 'create';
};

export const EditTransactionDialog = ({ isOpen, onClose, onSave, onCreate, categories, budgetUuid, transaction, mode = 'edit' }: Props) => {
    const [amount, setAmount] = useState(transaction?.amount || 0);
    const [categoryId, setCategoryId] = useState(transaction?.categoryId || '');
    const [date, setDate] = useState(transaction?.date || new Date().toISOString().split('T')[0]);
    const [payeeName, setPayeeName] = useState('');
    const [memo, setMemo] = useState('');
    const [accountId, setAccountId] = useState('');
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    // Load accounts when dialog opens for create mode
    useEffect(() => {
        if (isOpen && mode === 'create') {
            const loadAccounts = async () => {
                try {
                    const accountsData = await getAccounts(budgetUuid);
                    setAccounts(accountsData);
                    // Set first account as default
                    if (accountsData.length > 0) {
                        setAccountId(accountsData[0].uuid);
                    }
                } catch (error) {
                    console.error('Failed to load accounts:', error);
                    setError('Failed to load accounts');
                }
            };
            loadAccounts();
        }
    }, [isOpen, mode, budgetUuid]);

    useEffect(() => {
        if (transaction && mode === 'edit') {
            setAmount(transaction.amount);
            setCategoryId(transaction.categoryId);
            setDate(transaction.date);
        } else if (mode === 'create') {
            // Reset form for create mode
            setAmount(0);
            setCategoryId('');
            setDate(new Date().toISOString().split('T')[0]);
            setPayeeName('');
            setMemo('');
            setAccountId('');
        }
    }, [transaction, mode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSaving(true);

        try {
            if (mode === 'create' && onCreate) {
                if (!accountId) {
                    setError('Please select an account');
                    setIsSaving(false);
                    return;
                }
                await onCreate({
                    amount,
                    categoryId,
                    date,
                    payeeName: payeeName || undefined,
                    memo: memo || undefined,
                    accountId
                });
            } else if (mode === 'edit' && onSave) {
                await onSave({
                    amount,
                    categoryId,
                    date
                });
            } else {
                setError('Invalid operation mode');
                setIsSaving(false);
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
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Amount</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(parseFloat(e.target.value))}
                            className="input input-bordered w-full"
                            required
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Category</span>
                        </label>
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="select select-bordered w-full"
                            required
                        >
                            <option value="">Select a category</option>
                            {categories.map((category) => (
                                <option key={category.uuid} value={category.uuid}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Date</span>
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="input input-bordered w-full"
                            required
                        />
                    </div>

                    {mode === 'create' && (
                        <>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Account</span>
                                </label>
                                <select
                                    value={accountId}
                                    onChange={(e) => setAccountId(e.target.value)}
                                    className="select select-bordered w-full"
                                    required
                                >
                                    <option value="">Select an account</option>
                                    {accounts.map((account) => (
                                        <option key={account.uuid} value={account.uuid}>
                                            {account.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Payee (optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={payeeName}
                                    onChange={(e) => setPayeeName(e.target.value)}
                                    className="input input-bordered w-full"
                                    placeholder="Enter payee name"
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Memo (optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={memo}
                                    onChange={(e) => setMemo(e.target.value)}
                                    className="input input-bordered w-full"
                                    placeholder="Enter memo"
                                />
                            </div>
                        </>
                    )}

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