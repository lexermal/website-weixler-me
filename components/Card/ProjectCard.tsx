import { Card } from "react-bootstrap";
import { ProjectItem } from "../../views/Projects/ProjectItems";
import css from "./ProjectCard.module.css";

export function ProjectCard(props: ProjectItem) {
  return (
    <a href={props.url} className={css.link}>
      <Card className={"text-center " + css.container}>
        <Card.Body>
          <Card.Title className={css.heading}>{props.name}</Card.Title>
          <Card.Text>{props.description}</Card.Text>
        </Card.Body>
      </Card>
    </a>
  );
}
