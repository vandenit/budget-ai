import { YnabSignIn } from "./login";

const YnabLoginPage = () => (
  <div className="flex min-h-full flex-col items-center justify-center">
    <h1 className="mb-12"></h1>
    <div className="items center mx-auto flex w-full max-w-md justify-center px-8">
      <YnabSignIn />
    </div>
  </div>
);

export default YnabLoginPage;
