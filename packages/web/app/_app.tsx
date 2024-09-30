import { AppProps } from "next/app";
import { useEffect } from "react";
import { overrideConsoleLog } from "common-ts";

const MyApp = ({ Component, pageProps }: AppProps) => {


  return <Component {...pageProps} />;
};

export default MyApp;
