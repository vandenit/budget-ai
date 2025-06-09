import { UserType, getUserByAuthId } from "../data/user/user.server";
import { Request, Response } from "express";

export const handleRequest =
  (handler: any) => async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);

    // Log incoming request
    console.log(`🚀 [${requestId}] ${req.method} ${req.url} - ${handler.name}`);
    if (req.method !== "GET" && Object.keys(req.body || {}).length > 0) {
      console.log(
        `📝 [${requestId}] Request body:`,
        JSON.stringify(req.body, null, 2)
      );
    }

    try {
      await handler(req, res);

      // Log completion with status code awareness
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      if (statusCode >= 400) {
        console.log(
          `⚠️ [${requestId}] ${req.method} ${req.url} completed with status ${statusCode} in ${duration}ms`
        );
      } else {
        console.log(
          `✅ [${requestId}] ${req.method} ${req.url} completed in ${duration}ms`
        );
      }
    } catch (exception) {
      // Log error with full details
      const duration = Date.now() - startTime;
      console.error(
        `❌ [${requestId}] Error handling ${req.method} ${req.url} after ${duration}ms`
      );
      console.error(`❌ [${requestId}] Handler: ${handler.name}`);
      console.error(`❌ [${requestId}] Exception:`, exception);
      console.error(
        `❌ [${requestId}] Stack:`,
        exception instanceof Error ? exception.stack : "No stack trace"
      );

      // Send generic error response
      res.status(500).json({
        error: "Internal Server Error",
        requestId: requestId,
        details:
          exception instanceof Error ? exception.message : "Unknown error",
      });
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
