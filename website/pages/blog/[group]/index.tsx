import Head from "next/head";
import { useEffect } from "react";
import AOS from "aos";
import css from "../../index.module.css";
import fs from "fs";
import FixedNavbar from "../../../components/Navbar";
import Footer from "../../../views/Footer/Footer";

export async function getServerSideProps() {
  const folders = fs.readdirSync("public/blog/");

  // Pass data to the page via props
  return { props: { group: folders } };
}

const Home = (props: { group: string[] }) => {
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
        Inside tutorials.... here are all the tutorials
      </main>

      <Footer />
    </>
  );
};

export default Home;
