import { getSession } from "@auth0/nextjs-auth0";
import { Budget } from "common-ts";
import { cache } from "react";

export const findBudgets = async (): Promise<Budget[]> => {
  // add Bearer from session
  const session = await getSession();
  if (!session || !session.accessToken) {
    throw new Error("no session found");
  }
  const apiUrl = process.env.API_URL || "joske";

  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  });
  const budgets = await response.json();
  return budgets;
};

export const findCachedBudgers = cache(findBudgets);
