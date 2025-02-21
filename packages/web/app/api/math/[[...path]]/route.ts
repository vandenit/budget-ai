import { getSession } from "@auth0/nextjs-auth0";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: { path?: string[] } }) {
    try {
        const session = await getSession();
        if (!session || !session.accessToken) {
            return new NextResponse(
                JSON.stringify({ error: "Not authenticated" }),
                { 
                    status: 401,
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );
        }

        // Get the search params from the request URL
        const searchParams = request.nextUrl.searchParams;
        const mathApiUrl = process.env.MATH_API_URL;

        if (!mathApiUrl) {
            throw new Error('MATH_API_URL not configured');
        }

        // Construct the full path including any nested routes
        const path = params.path ? params.path.join('/') : '';

        // Forward the request to the math API
        const response = await fetch(`${mathApiUrl}/${path}?${searchParams}`, {
            headers: {
                'Authorization': `Bearer ${session.accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Math API error: ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Error proxying to math API:", error);
        return new NextResponse(
            JSON.stringify({ error: "Server error" }),
            { 
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );
    }
}

export async function POST(request: NextRequest, { params }: { params: { path?: string[] } }) {
    try {
        const session = await getSession();
        if (!session || !session.accessToken) {
            return new NextResponse(
                JSON.stringify({ error: "Not authenticated" }),
                { 
                    status: 401,
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );
        }

        const mathApiUrl = process.env.MATH_API_URL;
        if (!mathApiUrl) {
            throw new Error('MATH_API_URL not configured');
        }

        const body = await request.json();
        const searchParams = request.nextUrl.searchParams;

        // Construct the full path including any nested routes
        const path = params.path ? params.path.join('/') : '';

        // Forward the request to the math API
        const response = await fetch(`${mathApiUrl}/${path}?${searchParams}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Math API error: ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Error proxying to math API:", error);
        return new NextResponse(
            JSON.stringify({ error: "Server error" }),
            { 
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );
    }
} 