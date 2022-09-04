import { useEffect } from "react";
import { Container } from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import Prism from "prismjs";
require("prismjs/components/prism-yaml");
require("prismjs/components/prism-bash");

function BlogEntry(props: { content: string }) {
  useEffect(() => {
    Prism.highlightAll();
  });
  
  return (
    <Container className="mt-5" id="blogEntry">
      <ReactMarkdown>{props.content}</ReactMarkdown>
    </Container>
  );
}

export default BlogEntry;
