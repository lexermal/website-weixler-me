import { Card, Col, Container, Row } from "react-bootstrap";
import css from "./BlogOverview.module.css";

function BlogOverview(props: { groups: string[] }) {
  return (
    <div>
      <Container>
        <h1 className="mb-5">This topics are available:</h1>
        {props.groups.map((e, k) => {
          return (
            <Row key={k}>
              <Col>
                <a id={css.topic} href={"/blog/" + e}>
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
    </div>
  );
}

export default BlogOverview;
