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
import { CategoryChangesForm } from './CategoryChangesForm';
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
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null);
    const [simulations, setSimulations] = useState<Simulation[]>(initialSimulations);
    const params = useParams();
    const budgetUuid = params.budgetUuid as string;

    const handleCreateSimulation = async (formData: { name: string }) => {
        try {
            const newSimulation = await createSimulation({
                budgetUuid,
                name: formData.name,
                categoryChanges: []
            });

            setSimulations([...simulations, newSimulation]);
            setCreateModalOpen(false);
            setSelectedSimulation(newSimulation);
            setEditModalOpen(true);
            toast.success("Simulation created successfully");
        } catch (error) {
            console.error('Error creating simulation:', error);
            toast.error("Failed to create simulation");
        }
    };

    const handleUpdateCategoryChanges = async (changes: CategoryChange[]) => {
        if (!selectedSimulation) return;

        try {
            const updatedSimulation = await createSimulation({
                budgetUuid,
                name: selectedSimulation.name,
                categoryChanges: changes
            });

            setSimulations(simulations.map(sim =>
                sim.id === selectedSimulation.id ? updatedSimulation : sim
            ));
            setEditModalOpen(false);
            toast.success("Category changes updated successfully");
        } catch (error) {
            console.error('Error updating category changes:', error);
            toast.error("Failed to update category changes");
        }
    };

    const handleEditSimulation = (simulation: Simulation) => {
        setSelectedSimulation(simulation);
        setEditModalOpen(true);
    };

    return (
        <div className="flex flex-col">
            <h2 className="text-lg font-semibold mb-4">Simulations</h2>
            <Button
                onClick={() => setCreateModalOpen(true)}
                className="w-full mb-4"
                variant="outline"
            >
                New Simulation
            </Button>

            <div className="flex-grow">
                <SimulationList
                    onNewClick={() => setCreateModalOpen(true)}
                    initialSimulations={simulations}
                    onEditSimulation={handleEditSimulation}
                />
            </div>

            <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Simulation</DialogTitle>
                    </DialogHeader>
                    <SimulationForm
                        onSubmit={handleCreateSimulation}
                        onCancel={() => setCreateModalOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={isEditModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Category Changes</DialogTitle>
                    </DialogHeader>
                    {selectedSimulation && (
                        <CategoryChangesForm
                            categories={categoryOptions}
                            initialChanges={selectedSimulation.categoryChanges}
                            onSubmit={handleUpdateCategoryChanges}
                            onCancel={() => setEditModalOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
} 