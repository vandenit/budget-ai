'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { SimulationForm } from './SimulationForm';
import { SimulationList } from './SimulationList';
import { createSimulation, type CategoryChange, type Simulation } from './actions';

interface InteractiveSimulationsProps {
    categoryOptions: { uuid: string; name: string; }[];
    initialSimulations: Simulation[];
}

export default function InteractiveSimulations({
    categoryOptions,
    initialSimulations
}: InteractiveSimulationsProps) {
    const [isModalOpen, setModalOpen] = useState(false);
    const params = useParams();
    const budgetUuid = params.budgetUuid as string;

    const handleSubmit = async (formData: { name: string; categoryChanges: CategoryChange[] }) => {
        try {
            await createSimulation({
                budgetUuid,
                name: formData.name,
                categoryChanges: formData.categoryChanges,
            });

            setModalOpen(false);
            toast.success("Simulation created successfully");
        } catch (error) {
            console.error('Error creating simulation:', error);
            toast.error("Failed to create simulation");
        }
    };

    return (
        <div className="flex flex-col">
            <h2 className="text-lg font-semibold mb-4">Simulations</h2>
            <Button
                onClick={() => setModalOpen(true)}
                className="w-full mb-4"
                variant="outline"
            >
                New Simulation
            </Button>

            <div className="flex-grow">
                <SimulationList
                    onNewClick={() => setModalOpen(true)}
                    initialSimulations={initialSimulations}
                />
            </div>

            <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Simulation</DialogTitle>
                    </DialogHeader>
                    <SimulationForm
                        categories={categoryOptions}
                        onSubmit={handleSubmit}
                        onCancel={() => setModalOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
} 