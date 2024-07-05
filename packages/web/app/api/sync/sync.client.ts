import "server-only";
export const syncBudgetData = async (): Promise<number> => {
  const apiBaseUrl = process.env.API_URL || "http://localhost:4000";
  const apiUrl = `${apiBaseUrl}/sync`;
  const headers: any = {
    "x-sync-secret": process.env.SYNC_SECRET,
    "Content-Type": "application/json",
  };
  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.nbrOfSyncedUsers;
};
