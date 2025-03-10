'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChangeEvent } from 'react';

interface SimulationFormProps {
    onSubmit: (data: { name: string }) => void;
    onCancel: () => void;
}

export function SimulationForm({ onSubmit, onCancel }: SimulationFormProps) {
    const [name, setName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name) {
            // TODO: Show error message
            return;
        }

        onSubmit({ name });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="name">Simulation Name</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    placeholder="e.g., Less Restaurants"
                    required
                />
            </div>

            <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit">
                    Create Simulation
                </Button>
            </div>
        </form>
    );
} 