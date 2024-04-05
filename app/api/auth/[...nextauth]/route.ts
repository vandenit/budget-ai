import NextAuth, { NextAuthOptions } from "next-auth";
import {
  createOrUpdateUser,
  connectUserWithYnab,
} from "../../user/user.server";
import { syncUser } from "../../sync/sync.server";

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "ynab",
      name: "YNAB",
      type: "oauth",
      authorization: {
        params: {
          scope: "read-only",
        },
        url: "https://app.ynab.com/oauth/authorize",
      },
      token: "https://app.ynab.com/oauth/token",
      clientId: process.env.YNAB_CLIENT_ID,
      clientSecret: process.env.YNAB_CLIENT_SECRET,
      profile(profile) {
        return {
          id: "test",
        };
      },
      userinfo: {
        request: () => ({}),
      },
    },
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account && account.refresh_token) {
        await connectUserWithYnab({
          accessToken: account.access_token || "",
          refreshToken: account.refresh_token || "",
        });
      }
      return token;
    },
    async session({ session }) {
      // Send properties to the client, like an access_token from a provider.
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
