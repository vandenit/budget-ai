import { redirect } from "next/navigation";
import { SignIn, SignOut } from "../components/login";
import { getSession } from "@auth0/nextjs-auth0";

async function LoginPage() {
  const session = await getSession();
  const isLoggedIn: boolean = !!session?.user;
  if (isLoggedIn) {
    redirect("/");
  }
  return (
    <div className="flex min-h-full flex-col items-center justify-center">
      <h1 className="mb-12"></h1>
      <div className="items center mx-auto flex w-full max-w-md justify-center px-8">
        <SignIn />
      </div>
    </div>
  );
}

export default LoginPage;
