import { getSession } from "@auth0/nextjs-auth0";

export const apiFetch = async (path: string, options: RequestInit = {}) => {
  const session = await getSession();
  if (!session || !session.accessToken) {
    throw new Error("no session found");
  }
  const apiBaseUrl = process.env.API_URL || "http://localhost:4000";
  const apiUrl = `${apiBaseUrl}/${path}`;
  console.log(`fetching ${apiUrl}, options: ${JSON.stringify(options)}`);
  const response = await fetch(apiUrl, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${session.accessToken}`,
    },
  });
  // todo remove log, not secure
  // console.log("access token: " + session.accessToken);
  if (!response.ok) {
    // Throw an error if response is not ok (status code is not in the range 200-299)
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response;
};

export const apiGet = async (path: string) => {
  const response = await apiFetch(path);
  return response.json();
};

export const apiPut = async (path: string, data: any) => {
  const response = await apiFetch(path, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.json();
};

export const apiPost = async (path: string, data: any) => {
  const response = await apiFetch(path, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.json();
};
