"use client";
import { signIn, signOut } from "next-auth/react";

export function SignOut() {
  return (
    <button className="btn" onClick={() => signOut({ callbackUrl: "/login" })}>
      Sign out
    </button>
  );
}

export function SignIn() {
  return (
    <button
      className="mb-4 flex rounded-md border border-gray-800 bg-black px-4 py-3 text-sm font-semibold text-neutral-200 transition-all hover:text-white"
      onClick={() => signIn("ynab", { callbackUrl: "/" })}
    >
      <div className="ml-3">Sign in with Ynab</div>
    </button>
  );
}
