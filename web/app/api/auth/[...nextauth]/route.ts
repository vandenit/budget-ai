import NextAuth from "next-auth";
import { connectUserWithYnab } from "../../user/user.server";
import { syncLoggedInUser, syncUser } from "../../sync/sync.server";
import { ynabAuthOptions } from "../../ynab/auth";

const handler = NextAuth(ynabAuthOptions);

export { handler as GET, handler as POST };
