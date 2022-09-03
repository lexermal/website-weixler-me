import { Github, Instagram, Linkedin } from "react-bootstrap-icons";
import css from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={css.footer}>
      <a
        target="_blank"
        rel={"noreferrer"}
        href="https://www.instagram.com/manuel.weixler/"
      >
        <Instagram />
      </a>
      <a target="_blank" rel={"noreferrer"} href="https://github.com/lexermal">
        <Github />
      </a>
      <a
        target="_blank"
        rel={"noreferrer"}
        href="https://www.linkedin.com/in/manuel-weixler-5187031b0/"
      >
        <Linkedin />
      </a>
      | © Weixler.me
    </footer>
  );
}
