import { Container } from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import css from "./BlogEntry.module.css";

function BlogEntry(props: { content: string }) {
  return (
    <Container className="mt-5" id="blogEntry">
      <ReactMarkdown>{props.content}</ReactMarkdown>
    </Container>
  );
}

export default BlogEntry;
