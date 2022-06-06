import css from "./ContactButton.module.css";

export default function ContactButton() {
  return (
    <button className={"col-sm-5 mx-auto " + css.button} onClick={onContact}>
      Contact me
    </button>
  );
}

function onContact() {
  document.location = "mailto:contact@weixler.me";
}
