import { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import Prism from "prismjs";
require("prismjs/components/prism-yaml");
require("prismjs/components/prism-bash");

function BlogEntry(props: { content: string | null }) {
  const [showChild, setShowChild] = useState(false);

  useEffect(() => {
    setShowChild(true);
    setTimeout(() => {
      Prism.highlightAll();
    }, 100);
  }, []);

  if (!showChild) {
    return null;
  }

  return (
    <Container className="mt-5" id="blogEntry">
      {props.content ? (
        <ReactMarkdown>{props.content}</ReactMarkdown>
      ) : (
        "Entry not found."
      )}

      <hr />
      <Col>
        <Row>
          <span id="source">
            For comments or improvements go
            <a href="https://github.com/lexermal/main_website/tree/master/blog">
              here
            </a>
            .
          </span>
        </Row>
      </Col>
    </Container>
  );
}

export default BlogEntry;
