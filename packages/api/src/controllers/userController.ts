import { UserView } from "common-ts";
import {
  connectUserWithYnab,
  createOrUpdateUser,
  savePreferredBudget,
} from "../data/user/user.server";
import { getUserFromReq } from "./utils";
import { Request, Response } from "express";
import { isYnabTokenExpired } from "../data/ynab/ynab-api";

export const handleConnectUserWithYnab = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      console.error("no user found");
      return res.status(401).send("Unauthorized");
    }
    const connection = req.body;
    await connectUserWithYnab(connection, user);
    res.send({ success: true });
  } catch (exception) {
    console.error(exception);
    res.status(400).send("Failed to connect user with YNAB");
  }
};

export const handleCreateOrUpdateUser = async (req: Request, res: Response) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      console.error("no user found");
      return res.status(401).send("Unauthorized");
    }
    const { authId, name } = req.body;
    await createOrUpdateUser({ authId, name });
    res.send({ success: true });
  } catch (exception) {
    console.error(exception);
    res.status(400).send("Failed to create or update user");
  }
};

export const handleGetLoggedInUser = async (req: Request, res: Response) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      console.error("no user found");
      return res.status(401).send("Unauthorized");
    }
    const hasYnabConnection = !!user.ynab?.connection;
    const isTokenExpired =
      hasYnabConnection && (await isYnabTokenExpired(user));

    const userView: UserView = {
      authId: user.authId,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      settings: user.settings,
      ynab: {
        isConnected: hasYnabConnection,
        isTokenExpired,
      },
    };
    res.json(userView);
  } catch (exception) {
    console.error(exception);
    res.status(400).send("Failed to get logged in user");
  }
};

export const handleSavePreferredBudget = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      console.error("no user found");
      return res.status(401).send("Unauthorized");
    }
    const { budgetUuid } = req.body;
    await savePreferredBudget(budgetUuid, user.authId);
  } catch (exception) {
    console.error(exception);
    res.status(400).send("Failed to save preferred budget");
  }
};
