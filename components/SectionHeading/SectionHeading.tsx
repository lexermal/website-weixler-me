import css from "./Projects.module.css";

export default function SectionHeading(props: { title: string }) {
  return (
    <div data-aos="fade-in">
      <h1 className={css.heading}>{props.title}</h1>
    </div>
  );
}
