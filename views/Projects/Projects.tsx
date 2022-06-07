import { Col, Container, Row } from "react-bootstrap";
import { ProjectCard } from "../../components/ProjectCard/ProjectCard";
import SectionHeading from "../../components/SectionHeading/SectionHeading";
import { projectItems } from "./ProjectItems";

export function Projects() {
  return (
    <Container>
      <SectionHeading title="Projects" anchor="projects" />
      <Row>
        {projectItems.map((item, index) => {
          return (
            <Col
              md={6}
              key={index}
              data-aos={index % 2 === 0 ? "fade-left" : "fade-right"}
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
