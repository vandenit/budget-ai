import { getSession } from "@auth0/nextjs-auth0";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await getSession();
    if (!session?.accessToken) {
        return new NextResponse(null, { status: 401 });
    }
    return NextResponse.json({ accessToken: session.accessToken });
} 