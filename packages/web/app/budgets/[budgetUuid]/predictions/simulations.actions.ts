'use client';

import { apiGet, apiPost, apiPut } from '@/app/api/client.browser';

export interface CategoryChange {
    categoryId: string;
    startDate: string;
    endDate: string;
    targetAmount: number;
}

export interface Simulation {
    id: string;
    budgetId: string;
    name: string;
    isActive: boolean;
    categoryChanges: CategoryChange[];
}

export async function getSimulations(budgetId: string): Promise<Simulation[]> {
    return apiGet(`/simulations?budgetId=${budgetId}`);
}

export async function createSimulation(data: {
    budgetId: string;
    name: string;
    categoryChanges: CategoryChange[];
}): Promise<Simulation> {
    return apiPost('/simulations', data);
}

export async function toggleSimulation(id: string): Promise<Simulation> {
    return apiPut(`/simulations/${id}/active`, {});
} 