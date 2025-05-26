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

export const getScheduledTransactions = async (budgetId: string) => mathApiFetch(
    `sheduled-transactions?budget_id=${budgetId}`
);

export const getUncategorisedTransactions = async (budgetId: string) => mathApiFetch(
    `uncategorised-transactions?budget_id=${budgetId}`
);

export const getCachedSuggestions = async (budgetId: string) => {
    const mathApiUrl = process.env.MATH_API_URL;

    if (!mathApiUrl) {
        throw new Error('MATH_API_URL environment variable is not set');
    }

    try {
        const response = await fetch(`${mathApiUrl}/uncategorised-transactions/suggestions-cached?budget_id=${budgetId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching cached suggestions:', error);
        throw error;
    }
};

export const getSuggestionsAsync = async (budgetId: string, transactionIds: string[]) => {
    const mathApiUrl = process.env.MATH_API_URL;

    if (!mathApiUrl) {
        throw new Error('MATH_API_URL environment variable is not set');
    }

    try {
        const response = await fetch(`${mathApiUrl}/uncategorised-transactions/suggestions-async?budget_id=${budgetId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                transaction_ids: transactionIds
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching async suggestions:', error);
        throw error;
    }
};

export const getSingleSuggestion = async (budgetId: string, transactionId: string, transaction?: any) => {
    const mathApiUrl = process.env.MATH_API_URL;

    if (!mathApiUrl) {
        throw new Error('MATH_API_URL environment variable is not set');
    }

    try {
        const body: any = { transaction_id: transactionId };
        if (transaction) {
            body.transaction = transaction;
        }

        const response = await fetch(`${mathApiUrl}/uncategorised-transactions/suggest-single?budget_id=${budgetId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching single suggestion:', error);
        throw error;
    }
};

export const applySingleCategory = async (budgetId: string, transactionId: string, categoryName: string) => {
    const mathApiUrl = process.env.MATH_API_URL;

    if (!mathApiUrl) {
        throw new Error('MATH_API_URL environment variable is not set');
    }

    try {
        const response = await fetch(`${mathApiUrl}/uncategorised-transactions/apply-single?budget_id=${budgetId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                transaction_id: transactionId,
                category_name: categoryName
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error applying single category:', error);
        throw error;
    }
};

export const suggestCategories = async (budgetId: string) => mathApiFetch(
    `uncategorised-transactions/suggest-categories?budget_id=${budgetId}`
);

export const applyCategories = async (budgetId: string) => mathApiFetch(
    `uncategorised-transactions/apply-categories?budget_id=${budgetId}`,
    { method: "POST" }
);

export const applyAllCategories = async (budgetId: string, transactions: any[]) => mathApiFetch(
    `uncategorised-transactions/apply-all-categories?budget_id=${budgetId}`,
    { 
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactions })
    }
); 