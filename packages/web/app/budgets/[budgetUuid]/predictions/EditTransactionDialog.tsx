"use client";

import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { Category } from 'common-ts';
import { ScheduledTransactionUpdate } from '../../../api/scheduledTransactions.client';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updates: ScheduledTransactionUpdate) => Promise<void>;
    categories: Category[];
    transaction?: {
        amount: number;
        categoryId: string;
        date: string;
    };
};

export const EditTransactionDialog = ({ isOpen, onClose, onSave, categories, transaction }: Props) => {
    const [amount, setAmount] = useState(transaction?.amount || 0);
    const [categoryId, setCategoryId] = useState(transaction?.categoryId || '');
    const [date, setDate] = useState(transaction?.date || '');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (transaction) {
            setAmount(transaction.amount);
            setCategoryId(transaction.categoryId);
            setDate(transaction.date);
        }
    }, [transaction]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSaving(true);

        try {
            await onSave({
                amount,
                categoryId,
                date
            });
            onClose();
        } catch (err) {
            setError('Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-base-100 rounded-lg p-6 w-full max-w-md relative">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Edit Transaction</h3>
                    <button
                        onClick={onClose}
                        className="btn btn-ghost btn-sm"
                        type="button"
                    >
                        <FiX className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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

                    {error && (
                        <div className="alert alert-error">
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 mt-6">
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
                            className="btn btn-primary"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}; 