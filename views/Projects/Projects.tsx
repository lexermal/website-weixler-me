import { Col, Container, Row } from "react-bootstrap";
import { ProjectCard } from "../../components/ProjectCard/ProjectCard";
import { projectItems } from "./ProjectItems";
import css from "./Projects.module.css";

export function Projects() {
  return (
    <Container>
      <div data-aos="fade-in">
        <h1 className={css.heading}>Projects</h1>
      </div>
      <Row>
        {projectItems.map((item, index) => {
          return (
            <Col
              xs={6}
              key={index}
              data-aos={index % 2 === 1 ? "fade-left" : "fade-right"}
            >
              <ProjectCard
                url={item.url}
                name={item.name}
                description={item.description}
              />
            </Col>
          );
        })}
      </Row>
    </Container>
  );
}
