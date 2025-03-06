"use server";
import { getSession } from "@auth0/nextjs-auth0";
import { handleServerApiResponse } from './utils.server';
import { headers } from 'next/headers';

export const getToken = async (accesToken?: string) => {
  if (accesToken) {
    return accesToken;
  }
  const session = await getSession();
  if (!session || !session.accessToken) {
    throw new Error("no session found");
  }
  // todo remove this log!
  //console.log("token", session.accessToken);
  return session.accessToken;
};

export const apiFetch = async (
  path: string,
  options: RequestInit = {},
  accesToken?: string
) => {
  const token = await getToken(accesToken);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const apiUrl = new URL(path, apiBaseUrl).toString();
  console.log(`fetching ${apiUrl}, options: ${JSON.stringify(options)}`);
  try {
    // Get current pathname from headers if available (server-side)
    let currentPath = '/';
    try {
      const headersList = headers();
      currentPath = headersList.get('x-pathname') || '/';
    } catch (e) {
      // Headers not available (client-side)
      if (typeof window !== 'undefined') {
        currentPath = window.location.pathname;
      }
    }

    const response = await fetch(apiUrl, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'x-pathname': currentPath,
      },
    });
    return handleServerApiResponse(apiUrl, response);
  } catch (error) {
    console.error(`Error fetching ${apiUrl}:`, error);
    throw error;
  }
};

export const apiGet = async <T>(path: string): Promise<T> => {
  return apiFetch(path);
};

export const apiPut = async (path: string, data: any, accessToken?: string) => {
  return apiFetch(
    path,
    {
      method: "PUT",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    },
    accessToken
  );
};

export const apiPost = async (path: string, data: any) => {
  return apiFetch(path, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });
};
