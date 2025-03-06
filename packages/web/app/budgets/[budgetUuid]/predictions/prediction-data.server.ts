import { apiGet } from "@/app/api/client";

export type SimulationData = {
    [date: string]: {
        balance: number;
        balance_diff?: number;
        changes: Array<{
            amount: number;
            category: string;
            reason: string;
            is_simulation?: boolean;
            memo?: string;
        }>;
    };
};

export type PredictionData = {
    [simulationName: string]: SimulationData;
};
