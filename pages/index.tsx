import type { NextPage } from "next";
import Head from "next/head";
import { useEffect } from "react";
import FixedNavbar from "../components/Navbar";
import AOS from "aos";
import { Projects } from "../views/Projects/Projects";
import Portfolio from "../views/Portfolio/Portfolio";
import Footer from "../views/Footer/Footer";
import css from "./index.module.css";

const Home: NextPage = () => {
  useEffect(() => {
    AOS.init({ delay: 100 });
  }, []);

  return (
    <>
      <Head>
        <title>Weixler.me</title>
        <meta name="description" content="Weixler.me" />
        {/* <link rel="icon" href="/favicon.ico" /> */}
      </Head>
      <FixedNavbar />

      <main className={css.main}>
        <Projects />
        <Portfolio />
      </main>

      <Footer />
    </>
  );
};

export default Home;
