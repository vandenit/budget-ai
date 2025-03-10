'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { toggleSimulation, type Simulation } from './actions';
import { toast } from 'sonner';

interface SimulationListProps {
    onNewClick: () => void;
    initialSimulations: Simulation[];
    onEditSimulation: (simulation: Simulation) => void;
}

export function SimulationList({ onNewClick, initialSimulations, onEditSimulation }: SimulationListProps) {
    const [simulations, setSimulations] = useState<Simulation[]>(initialSimulations);

    useEffect(() => {
        console.log('Initial simulations:', initialSimulations);
    }, [initialSimulations]);

    const handleToggleSimulation = async (simulation: Simulation) => {
        console.log('Toggling simulation:', simulation);
        console.log('Simulation id:', simulation.id);
        console.log('Simulation _id:', (simulation as any)._id);

        if (!simulation.id && !(simulation as any)._id) {
            console.error('No simulation id found');
            toast.error("Failed to toggle simulation: No simulation id found");
            return;
        }

        try {
            const id = simulation.id || (simulation as any)._id;
            console.log('Calling toggleSimulation with id:', id);
            const updatedSimulation = await toggleSimulation(id);
            console.log('Received updated simulation:', updatedSimulation);

            setSimulations(simulations.map(sim =>
                (sim.id || (sim as any)._id) === id ? updatedSimulation : sim
            ));
            toast.success("Simulation toggled successfully");
        } catch (error) {
            console.error('Error toggling simulation:', error);
            toast.error("Failed to toggle simulation");
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
                            key={simulation.id || (simulation as any)._id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                        >
                            <div className="flex-grow">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium">{simulation.name}</h3>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEditSimulation(simulation)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
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