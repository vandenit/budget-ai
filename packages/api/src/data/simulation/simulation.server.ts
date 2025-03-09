import { Simulation, SimulationType } from './simulation.schema';
import { getBudget } from '../budget/budget.server';
import type { UserType } from '../user/user.server';

export async function findSimulationsForBudget(budgetId: string): Promise<SimulationType[]> {
    return Simulation.find({ budgetId });
}

export async function createSimulation(
    budgetUuid: string,
    user: UserType,
    data: {
        name: string;
        categoryChanges: {
            categoryId: string;
            startDate: Date;
            endDate: Date;
            targetAmount: number;
        }[];
    }
): Promise<SimulationType> {
    const budget = await getBudget(budgetUuid, user);
    if (!budget) {
        throw new Error('Budget not found');
    }

    const simulation = new Simulation({
        budgetId: budget._id,
        name: data.name,
        categoryChanges: data.categoryChanges.map(change => ({
            ...change,
            categoryId: change.categoryId // MongoDB zal dit automatisch converteren naar ObjectId
        }))
    });

    return simulation.save();
}

export async function toggleSimulation(id: string): Promise<SimulationType> {
    const simulation = await Simulation.findById(id);
    if (!simulation) {
        throw new Error('Simulation not found');
    }

    simulation.isActive = !simulation.isActive;
    return simulation.save();
} 