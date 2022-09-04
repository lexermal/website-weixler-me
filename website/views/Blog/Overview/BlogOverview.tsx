import { Col, Container, Row } from "react-bootstrap";

function BlogOverview(props: { groups: string[] }) {
  return (
    <div>
      <h1>Weixler.me Blog</h1>

      <Container>
        <p>The following areas are available:</p>
        {props.groups.map((e, k) => {
          return (
            <Row key={k}>
              <Col>
                <a href={"/blog/" + e}>
                  <h2>{e}</h2>
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
