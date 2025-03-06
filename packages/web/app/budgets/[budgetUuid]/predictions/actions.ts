'use server';

import { revalidatePath } from "next/cache";
import { apiGet, apiPost, apiPut } from "@/app/api/client";

export interface CategoryChange {
    categoryId: string;
    startDate: string;
    endDate: string;
    targetAmount: number;
}

export interface Simulation {
    id: string;
    budgetUuid: string;
    name: string;
    isActive: boolean;
    categoryChanges: CategoryChange[];
}

export async function getSimulations(budgetUuid: string): Promise<Simulation[]> {
    return apiGet(`/simulations/budget/${budgetUuid}`);
}

export async function createSimulation(data: {
    budgetUuid: string;
    name: string;
    categoryChanges: CategoryChange[];
}): Promise<Simulation> {
    const simulation = await apiPost(`/simulations/budget/${data.budgetUuid}`, {
        name: data.name,
        categoryChanges: data.categoryChanges
    });
    
    // Invalidate the cache for the predictions page
    revalidatePath('/budgets/[budgetUuid]/predictions');

    return simulation;
}

export async function toggleSimulation(id: string): Promise<Simulation> {
    const simulation = await apiPut(`/simulations/${id}/active`, {});
    
    // Invalidate the cache for the predictions page
    revalidatePath('/budgets/[budgetUuid]/predictions');

    return simulation;
} 