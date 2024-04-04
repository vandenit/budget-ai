import { NextRequest } from "next/server";
import { syncBudgetData } from "./sync.server";

export async function POST(request: NextRequest) {
  const nbrOfSyncedUsers = await syncBudgetData();
  return Response.json({
    status: 201,
    body: {
      nbrOfSyncedUsers,
    },
  });
}
