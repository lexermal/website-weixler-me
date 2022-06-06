import type { AppProps } from "next/app";
import "bootstrap/dist/css/bootstrap.min.css";
import "aos/dist/aos.css";
import "./globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
