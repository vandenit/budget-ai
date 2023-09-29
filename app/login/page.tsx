import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SignIn } from "../components/login";
import { authOptions } from "../api/auth/[...nextauth]/route";

async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) {
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
