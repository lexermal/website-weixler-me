import Head from "next/head";
import { useEffect } from "react";
import AOS from "aos";
import css from "../../index.module.css";
import fs from "fs";
import FixedNavbar from "../../../components/Navbar";
import Footer from "../../../views/Footer/Footer";
import BlogEntry from "../../../views/Blog/BlogEntry/BlogEntry";

export async function getServerSideProps(context: any) {
  const url = context.resolvedUrl as string;
  const file = fs.readFileSync("public" + url.replaceAll("-", " ") + ".md");

  // Pass data to the page via props
  return {
    props: {
      content: file.toString(),
    },
  };
}

const Home = (props: { content: string }) => {
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
        <BlogEntry content={props.content} />
      </main>

      <Footer />
    </>
  );
};

export default Home;
