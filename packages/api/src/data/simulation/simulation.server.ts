import { Simulation } from "./simulation.schema";
import { UserType } from "../user/user.server";
import { getBudget } from "../budget/budget.server";
import connectDb from "../db";

export type CreateSimulationInput = {
    name: string;
    categoryChanges: {
        categoryUuid: string;
        startDate?: Date;
        endDate?: Date;
        targetAmount: number;
    }[];
};

export type UpdateSimulationInput = {
    name: string;
    categoryChanges: {
        categoryUuid: string;
        startDate?: Date;
        endDate?: Date;
        targetAmount: number;
    }[];
};

export const findSimulationsForBudget = async (budgetId: string) => {
    connectDb();
    return Simulation.find({ budgetId });
};

export const createSimulation = async (budgetUuid: string, user: UserType, data: CreateSimulationInput) => {
    connectDb();
    const budget = await getBudget(budgetUuid, user);
    if (!budget) {
        throw new Error('Budget not found');
    }

    const simulation = new Simulation({
        budgetId: budget._id,
        name: data.name,
        categoryChanges: data.categoryChanges
    });

    await simulation.save();
    return simulation;
};

export const updateSimulation = async (id: string, data: UpdateSimulationInput) => {
    connectDb();
    const simulation = await Simulation.findById(id);
    if (!simulation) {
        throw new Error('Simulation not found');
    }

    simulation.name = data.name;
    simulation.categoryChanges = data.categoryChanges;
    await simulation.save();
    return simulation;
};

export const toggleSimulation = async (id: string) => {
    connectDb();
    const simulation = await Simulation.findById(id);
    if (!simulation) {
        throw new Error('Simulation not found');
    }

    simulation.isActive = !simulation.isActive;
    await simulation.save();
    return simulation;
};

export const deleteSimulation = async (id: string) => {
    connectDb();
    const simulation = await Simulation.findByIdAndDelete(id);
    if (!simulation) {
        throw new Error('Simulation not found');
    }
    return simulation;
}; 