'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { getSimulations, toggleSimulation, type Simulation } from './simulations.actions';

interface SimulationListProps {
    onNewClick: () => void;
}

export function SimulationList({ onNewClick }: SimulationListProps) {
    const params = useParams();
    const budgetId = params.budgetUuid as string;
    const [simulations, setSimulations] = useState<Simulation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSimulations();
    }, [budgetId]);

    const fetchSimulations = async () => {
        try {
            const data = await getSimulations(budgetId);
            setSimulations(data);
        } catch (error) {
            console.error('Error fetching simulations:', error);
            // TODO: Show error message
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSimulation = async (id: string) => {
        try {
            const updatedSimulation = await toggleSimulation(id);
            setSimulations(simulations.map(sim =>
                sim.id === id ? updatedSimulation : sim
            ));
        } catch (error) {
            console.error('Error toggling simulation:', error);
            // TODO: Show error message
        }
    };

    if (loading) {
        return <div>Loading simulations...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Simulations</h2>
                <Button onClick={onNewClick}>
                    New Simulation
                </Button>
            </div>

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