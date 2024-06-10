import { UserType, getUserByAuthId } from "../data/user/user.server";

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
