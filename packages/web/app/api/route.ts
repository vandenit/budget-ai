import { getFilteredTransactionsWithCategories } from "./transaction/transaction.client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const budgetId = searchParams.get('budgetId');

    if (!budgetId) {
        return NextResponse.json({ error: 'Budget ID is required' }, { status: 400 });
    }

    try {
        const { categories } = await getFilteredTransactionsWithCategories(budgetId);
        return NextResponse.json({ categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json(
            { error: 'Failed to fetch categories' },
            { status: 500 }
        );
    }
} 