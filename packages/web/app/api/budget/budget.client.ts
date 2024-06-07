import { getSession } from "@auth0/nextjs-auth0";
import { Budget } from "common-ts";
import { cache } from "react";

// todo: clean up and extract boilerplate code for other api calls
export const findBudgets = async (): Promise<Budget[]> => {
  try {
    // add Bearer from session
    const session = await getSession();
    if (!session || !session.accessToken) {
      throw new Error("no session found");
    }
    const apiBaseUrl = process.env.API_URL || "http://localhost:4000";
    const apiUrl = `${apiBaseUrl}/budgets`;
    console.log("api url?" + apiUrl);
    // console.log("access token?" + session.accessToken);
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });
    if (!response.ok) {
      // Throw an error if response is not ok (status code is not in the range 200-299)
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const budgets = await response.json();
    return budgets;
  } catch (exception) {
    console.error("exception in findBudgets", exception);
    return [];
  }
};

export const findCachedBudgers = cache(findBudgets);
