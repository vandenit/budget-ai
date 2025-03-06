'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { toggleSimulation, type Simulation } from './actions';
import { toast } from 'sonner';

interface SimulationListProps {
    onNewClick: () => void;
    initialSimulations: Simulation[];
}

export function SimulationList({ onNewClick, initialSimulations }: SimulationListProps) {
    const [simulations, setSimulations] = useState<Simulation[]>(initialSimulations);

    const handleToggleSimulation = async (id: string) => {
        try {
            const updatedSimulation = await toggleSimulation(id);
            setSimulations(simulations.map(sim =>
                sim.id === id ? updatedSimulation : sim
            ));
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
                            key={simulation.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                        >
                            <div>
                                <h3 className="font-medium">{simulation.name}</h3>
                                <p className="text-sm text-gray-500">
                                    {simulation.categoryChanges.length} category changes
                                </p>
                            </div>
                            <Switch
                                checked={simulation.isActive}
                                onCheckedChange={() => handleToggleSimulation(simulation.id)}
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
} 