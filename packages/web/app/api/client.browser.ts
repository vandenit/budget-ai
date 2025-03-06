import { getSession } from "@auth0/nextjs-auth0";

const getToken = async (accesToken?: string) => {
  if (accesToken) {
    return accesToken;
  }
  const session = await getSession();
  if (!session || !session.accessToken) {
    throw new Error("no session found");
  }
  return session.accessToken;
};

export const apiFetch = async (
  path: string,
  options: RequestInit = {},
  accesToken?: string
) => {
  const token = await getToken(accesToken);
  const apiBaseUrl = process.env.API_URL || "http://localhost:4000";
  const apiUrl = new URL(path, apiBaseUrl).toString();

  try {
    const response = await fetch(apiUrl, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'x-pathname': window.location.pathname,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/api/auth/login';
        return null;
      }
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Error fetching ${apiUrl}:`, error);
    throw error;
  }
};

export const apiGet = async <T>(path: string): Promise<T> => {
  return apiFetch(path);
};

export const apiPut = async <T>(path: string, data: any, accessToken?: string): Promise<T> => {
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

export const apiPost = async <T>(path: string, data: any): Promise<T> => {
  return apiFetch(path, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });
}; 