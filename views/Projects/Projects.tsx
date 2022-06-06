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
