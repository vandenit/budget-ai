import { Category } from "common-ts";
import { getBudget, getBudgetOverviewForUser } from "./budget/budget.client";

export const getCategories = async (budgetId: string): Promise<Category[]> => {
    // todo : provide real catogories api
    const budget = await getBudgetOverviewForUser(budgetId);
    if (!budget) {
        throw new Error('Failed to fetch categories');
    }
    return budget.categories;
}; 