import Head from "next/head";
import { useEffect } from "react";
import AOS from "aos";
import css from "../../index.module.css";
import fs from "fs";
import FixedNavbar from "../../../components/Navbar";
import Footer from "../../../views/Footer/Footer";

export async function getServerSideProps(context: any) {
  const url = context.resolvedUrl as string;
  const files = fs.readdirSync("public" + url);

  // Pass data to the page via props
  return {
    props: {
      group: url.split("/")[2],
      entries: files.filter((e) => e.endsWith(".md")),
    },
  };
}

const Home = (props: { group: string; entries: string[] }) => {
  useEffect(() => {
    AOS.init({ delay: 100 });
  }, []);

  return (
    <>
      <Head>
        <title>Weixler.me Blog</title>
        <meta name="description" content="Weixler.me" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* <link rel="icon" href="/favicon.ico" /> */}
      </Head>
      <FixedNavbar />

      <main className={css.main}>
        <h1>area {props.group}</h1>
        Inside tutorials.... here are all the tutorials
        {props.entries.join(", ")}
      </main>

      <Footer />
    </>
  );
};

export default Home;
