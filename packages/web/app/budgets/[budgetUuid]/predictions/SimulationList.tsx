'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { toggleSimulation, deleteSimulation, type Simulation } from './actions';
import { toast } from 'sonner';

interface SimulationListProps {
    onNewClick: () => void;
    initialSimulations: Simulation[];
    onEditSimulation: (simulation: Simulation) => void;
}

export function SimulationList({ onNewClick, initialSimulations, onEditSimulation }: SimulationListProps) {
    const [simulations, setSimulations] = useState<Simulation[]>(initialSimulations);

    useEffect(() => {
        setSimulations(initialSimulations);
    }, [initialSimulations]);

    useEffect(() => {
        console.log('Initial simulations:', initialSimulations);
    }, [initialSimulations]);

    const handleToggleSimulation = async (simulation: Simulation) => {
        console.log('Toggling simulation:', simulation);
        console.log('Simulation _id:', simulation._id);

        if (!simulation._id) {
            console.error('No simulation id found');
            toast.error("Failed to toggle simulation: No simulation id found");
            return;
        }

        try {
            console.log('Calling toggleSimulation with id:', simulation._id);
            const updatedSimulation = await toggleSimulation(simulation._id);
            console.log('Received updated simulation:', updatedSimulation);

            setSimulations(simulations.map(sim =>
                sim._id === simulation._id ? updatedSimulation : sim
            ));
            toast.success("Simulation toggled successfully");
        } catch (error) {
            console.error('Error toggling simulation:', error);
            toast.error("Failed to toggle simulation");
        }
    };

    const handleDeleteSimulation = async (simulation: Simulation) => {
        if (!simulation._id) {
            console.error('No simulation id found');
            toast.error("Failed to delete simulation: No simulation id found");
            return;
        }

        try {
            await deleteSimulation(simulation._id);
            setSimulations(simulations.filter(sim => sim._id !== simulation._id));
            toast.success("Simulation deleted successfully");
        } catch (error) {
            console.error('Error deleting simulation:', error);
            toast.error("Failed to delete simulation");
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {simulations.length === 0 ? (
                    <p className="text-gray-500">No simulations yet. Create one to get started!</p>
                ) : (
                    simulations.map((simulation) => (
                        <div
                            key={simulation._id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                        >
                            <div className="flex-grow">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium">{simulation.name}</h3>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEditSimulation(simulation)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteSimulation(simulation)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500">
                                    {simulation.categoryChanges.length} category changes
                                </p>
                            </div>
                            <Switch
                                checked={simulation.isActive}
                                onCheckedChange={() => handleToggleSimulation(simulation)}
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
} 