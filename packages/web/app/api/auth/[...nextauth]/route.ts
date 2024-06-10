import NextAuth from "next-auth";
import { ynabAuthOptions } from "../../ynab/auth";

const handler = NextAuth(ynabAuthOptions);

export { handler as GET, handler as POST };
