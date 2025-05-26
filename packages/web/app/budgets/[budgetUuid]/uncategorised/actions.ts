"use server";

import { applyCategories as applyCategoriesApi, applyAllCategories as applyAllCategoriesApi, getSuggestionsAsync as getSuggestionsAsyncApi, getSingleSuggestion as getSingleSuggestionApi, applySingleCategory as applySingleCategoryApi } from '../../../api/math.server';

export async function applyCategories(budgetId: string) {
    try {
        return await applyCategoriesApi(budgetId);
    } catch (error) {
        console.error('Error applying categories:', error);
        throw error;
    }
}

export async function applyAllCategories(budgetId: string, transactions: any[]) {
    try {
        return await applyAllCategoriesApi(budgetId, transactions);
    } catch (error) {
        console.error('Error applying all categories:', error);
        throw error;
    }
}

export async function getSuggestionsAsync(budgetId: string, transactionIds: string[]) {
    try {
        return await getSuggestionsAsyncApi(budgetId, transactionIds);
    } catch (error) {
        console.error('Error getting async suggestions:', error);
        throw error;
    }
}

export async function getSingleSuggestion(budgetId: string, transactionId: string, transaction?: any) {
    try {
        return await getSingleSuggestionApi(budgetId, transactionId, transaction);
    } catch (error) {
        console.error('Error getting single suggestion:', error);
        throw error;
    }
}

export async function applySingleCategory(budgetId: string, transactionId: string, categoryName: string) {
    try {
        return await applySingleCategoryApi(budgetId, transactionId, categoryName);
    } catch (error) {
        console.error('Error applying single category:', error);
        throw error;
    }
} 