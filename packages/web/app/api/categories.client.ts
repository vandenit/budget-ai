import { Category } from "common-ts";

export const getCategories = async (budgetId: string): Promise<Category[]> => {
    const response = await fetch(`/api?budgetId=${budgetId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch categories');
    }
    const data = await response.json();
    return data.categories;
}; 