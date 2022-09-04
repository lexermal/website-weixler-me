import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import Prism from "prismjs";
require("prismjs/components/prism-yaml");
require("prismjs/components/prism-bash");

function BlogEntry(props: { content: string }) {
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
      <ReactMarkdown>{props.content}</ReactMarkdown>
    </Container>
  );
}

export default BlogEntry;
