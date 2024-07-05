import { NextRequest, NextResponse } from "next/server";
import { syncBudgetData } from "./sync.client";

const containsSecret = (request: NextRequest) => {
  const secret = process.env.SYNC_SECRET;
  const requestSecret = request.headers.get("x-sync-secret");
  return secret === requestSecret;
};
export async function POST(request: NextRequest) {
  if (!containsSecret(request)) {
    return NextResponse.json(
      {
        message: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }
  const nbrOfSyncedUsers = await syncBudgetData();
  return NextResponse.json({
    status: 201,
    body: {
      nbrOfSyncedUsers,
    },
  });
}
