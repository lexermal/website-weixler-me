import { Row, Col, Card, Container } from "react-bootstrap";
import css from "./EntrySelection.module.css";

function EntrySelection(props: { currentFolder: string; entries: string[] }) {
  const basePath = "/blog/" + props.currentFolder + "/";

  return (
    <Container>
      <h1 className="mb-5">{props.currentFolder}:</h1>
      {props.entries
        .map((e) => e.replace(".md", ""))
        .map((e, k) => {
          return (
            <Row key={k}>
              <Col>
                <a id={css.topic} href={basePath + e.replaceAll(" ", "-")}>
                  <Card className="mb-3">
                    <Card.Body>
                      <h2>{e}</h2>
                    </Card.Body>
                  </Card>
                </a>
              </Col>
            </Row>
          );
        })}
    </Container>
  );
}

export default EntrySelection;
