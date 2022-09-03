import { Card } from "react-bootstrap";
import { ProjectItem } from "../../views/Projects/ProjectItems";
import css from "./ProjectCard.module.css";

export function ProjectCard(props: ProjectItem) {
  if (!props.url) {
    return <PureCard name={props.name} description={props.description} />;
  }

  return (
    <a href={props.url} className={css.link}>
      <PureCard name={props.name} description={props.description} />
    </a>
  );
}

function PureCard(props: { name: string | JSX.Element; description: string }) {
  return (
    <Card className={"text-center " + css.container}>
      <Card.Body>
        <Card.Title className={css.heading}>{props.name}</Card.Title>
        <Card.Text>{props.description}</Card.Text>
      </Card.Body>
    </Card>
  );
}
