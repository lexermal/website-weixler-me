import css from "./Projects.module.css";

interface Props {
  title: string;
  anchor: string;
}

export default function SectionHeading(props: Props) {
  return (
    <div data-aos="fade-in">
      <a id={props.anchor}>
        <h1 className={css.heading}>{props.title}</h1>
      </a>
    </div>
  );
}
