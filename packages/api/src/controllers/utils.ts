import { UserType, getUserByAuthId } from "../data/user/user.server";
import { Request, Response } from "express";

export const handleRequest =
  (handler: any) => async (req: Request, res: Response) => {
    try {
      await handler(req, res);
    } catch (exception) {
      console.error(
        `error handling request: ${req.url}, method name: ${handler.name}. Exception:`,
        exception
      );
      res.status(500).send("Internal Server Error");
    }
  };

export const getUserFromReq = async (req: any): Promise<UserType | null> => {
  // get user sub from authorization header
  console.log(`userId: ${req.auth.payload.sub}`);
  const authId = req?.auth?.payload?.sub;
  if (!authId) {
    return null;
  }
  // get user from database
  const user = await getUserByAuthId(authId);
  if (!user) {
    return null;
  }
  return user;
};
