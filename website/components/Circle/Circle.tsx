import css from "./Circle.module.css";

export default function Circle(props: { full: boolean }) {
  return (
    <div
      className={css.circle + " " + (props.full ? css.full : css.empty)}
    ></div>
  );
}
