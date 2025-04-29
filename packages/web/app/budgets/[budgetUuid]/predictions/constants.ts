export type TimeRange = '1m' | '3m' | '6m' | '9m' | '1y';

export const TIME_RANGES = {
    '1m': { label: '1 month', days: 30 },
    '3m': { label: '3 months', days: 90 },
    '6m': { label: '6 months', days: 180 },
    '9m': { label: '9 months', days: 270 },
    '1y': { label: '1 year', days: 365 }
} as const;

export const DEFAULT_TIME_RANGE: TimeRange = '3m'; 