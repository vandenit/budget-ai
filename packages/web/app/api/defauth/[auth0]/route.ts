import {
  handleAuth,
  handleCallback,
  Session,
  AfterCallbackAppRoute,
} from "@auth0/nextjs-auth0";
import { createOrUpdateUser } from "../../user/user.client";
import { NextRequest } from "next/server";

const afterCallback: AfterCallbackAppRoute = async (
  req: NextRequest,
  session: Session
) => {
  if (session.user) {
    await createOrUpdateUser({
      authId: session.user.sub,
      name: session.user.name,
      accessToken: session.accessToken,
    });
  }
  return session;
};

export const GET = handleAuth({
  callback: handleCallback(() => {
    return {
      afterCallback,
    };
  }),
});
