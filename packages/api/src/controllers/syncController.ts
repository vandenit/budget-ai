import { Request, Response } from "express";
import { syncBudgetData } from "../data/sync/sync.server";

const containsSecret = (request: Request) => {
  const secret = process.env.SYNC_SECRET;
  const requestSecret = request.headers["x-sync-secret"];
  return secret === requestSecret;
};

export const handleSyncBudgetData = async (req: Request, res: Response) => {
  // get user from database
  if (!containsSecret(req)) {
    return res.status(401).send("Unauthorized");
  }
  const nbrOfSyncedUsers = await syncBudgetData();
  res.json({
    nbrOfSyncedUsers,
  });
};
