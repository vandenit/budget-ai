import { getToken } from "./client";
import { handleServerApiResponse } from "./utils.server";


const mathApiFetch = async (
    path: string,
    options: RequestInit = {},
    accesToken?: string 
) => {
    try {
        const token = await getToken(accesToken);
        const apiBaseUrl = process.env.MATH_API_URL || "http://localhost:5000";
        const apiUrl = new URL(path, apiBaseUrl).toString();
        const response = await fetch(apiUrl, {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Math API error! status: ${response.status}, message: ${errorText}`);
        }

        return handleServerApiResponse(apiUrl, response);
    } catch (error) {
        console.error(`Error calling math API ${path}:`, error);
        throw error;
    }
};

export const getPrediction = async (budgetId: string, daysAhead: number = 180) => mathApiFetch(
    `balance-prediction/data?budget_id=${budgetId}&days_ahead=${daysAhead}`
);
export const getScheduledTransactions = async (budgetId: string) => (
    mathApiFetch(`sheduled-transactions?budget_id=${budgetId}`));

export const suggestCategories = async (budgetId: string) => mathApiFetch(
    `uncategorised-transactions/suggest-categories?budget_id=${budgetId}`
);

export const applyCategories = async (budgetId: string) => mathApiFetch(
    `uncategorised-transactions/apply-categories?budget_id=${budgetId}`,
    { method: "POST" }
); 