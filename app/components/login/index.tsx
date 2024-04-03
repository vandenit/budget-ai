"use client";

import { signIn } from "next-auth/react";

export function SignOut() {
  return (
    <div className="mb-4 flex rounded-md border border-gray-800 bg-black px-4 py-3 text-sm font-semibold text-neutral-200 transition-all hover:text-white">
      <a href="/api/defauth/logout">Logout</a>
    </div>
  );
}

export function SignIn() {
  return (
    <div className="mb-4 flex rounded-md border border-gray-800 bg-black px-4 py-3 text-sm font-semibold text-neutral-200 transition-all hover:text-white">
      <a href="/api/defauth/login">Login</a>
    </div>
  );
}

export const YnabSignIn = () => (
  <button
    className="mb-4 flex rounded-md border border-gray-800 bg-black px-4 py-3 text-sm font-semibold text-neutral-200 transition-all hover:text-white"
    onClick={() => signIn("ynab", { callbackUrl: "/" })}
  >
    <div className="ml-3">Connect to Ynab</div>
  </button>
);
