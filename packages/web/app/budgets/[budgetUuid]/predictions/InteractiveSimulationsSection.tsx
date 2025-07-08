import { getCategories } from '@/app/api/categories.client';
import { getSimulations } from './actions';
import InteractiveSimulations from './InteractiveSimulations';

interface InteractiveSimulationsSectionProps {
    budgetUuid: string;
}

export default async function InteractiveSimulationsSection({ budgetUuid }: InteractiveSimulationsSectionProps) {
    const [categories, simulations] = await Promise.all([
        getCategories(budgetUuid),
        getSimulations(budgetUuid)
    ]);

    const categoryOptions = categories.map(category => ({ uuid: category.uuid, name: category.name }));

    return (
        <InteractiveSimulations
            categoryOptions={categoryOptions}
            initialSimulations={simulations}
        />
    );
}
