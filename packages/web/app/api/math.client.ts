import { getSession } from "@auth0/nextjs-auth0";

const getMathToken = async (accessToken?: string) => {
    if (accessToken) {
        return accessToken;
    }

    const session = await getSession();
    if (!session || !session.accessToken) {
        throw new Error("Geen sessie gevonden");
    }
    return session.accessToken;
};

const mathApiFetch = async (
    path: string,
    options: RequestInit = {},
) => {
    try {
        const response = await fetch(`/api/math/${path}`, {
            ...options,
            headers: {
                ...options.headers,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Math API error! status: ${response.status}, message: ${errorText}`);
        }

        return response;
    } catch (error) {
        console.error(`Error calling math API ${path}:`, error);
        throw error;
    }
};

export const getPrediction = async (budgetId: string, daysAhead: number = 180) => {
    const response = await mathApiFetch(
        `balance-prediction/data?budget_id=${budgetId}&days_ahead=${daysAhead}`
    );
    return response.json();
};

export const getScheduledTransactions = async (budgetId: string) => {
    const response = await mathApiFetch(`sheduled-transactions?budget_id=${budgetId}`);
    return response.json();
};

export const suggestCategories = async (budgetId: string) => {
    const response = await mathApiFetch(
        `uncategorised-transactions/suggest-categories?budget_id=${budgetId}`
    );
    return response.json();
};

export const applyCategories = async (budgetId: string) => {
    const response = await mathApiFetch(
        `uncategorised-transactions/apply-categories?budget_id=${budgetId}`,
        { method: "POST" }
    );
    return response.json();
}; 