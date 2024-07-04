export type UserView = {
  authId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  settings: {
    preferredBudgetUuid: string;
  };
  ynab: {
    isConnected: boolean;
    isTokenExpired: boolean;
  };
};
