import {
  handleAuth,
  handleCallback,
  AfterCallback,
  Session,
  GetLoginState,
  CallbackOptions,
  AfterCallbackAppRoute,
} from "@auth0/nextjs-auth0";
import { createOrUpdateUser } from "../../user/user.client";
import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";

const afterCallback: AfterCallbackAppRoute = async (
  req: NextRequest,
  session: Session,
  state: any
) => {
  if (session.user) {
    await createOrUpdateUser({
      authId: session.user.sub,
      name: session.user.name,
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
