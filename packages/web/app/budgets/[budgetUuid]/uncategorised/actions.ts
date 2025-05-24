"use server";

import { applyCategories as applyCategoriesApi } from '../../../api/math.server';

export async function applyCategories(budgetId: string) {
    try {
        return await applyCategoriesApi(budgetId);
    } catch (error) {
        console.error('Error applying categories:', error);
        throw error;
    }
} 