import { Col, Row } from "react-bootstrap";
import css from "./PortfolioEntry.module.css";

interface Props {
  year: number | string;
  title: string;
  description: string;
}

export default function PortfolioEntry(props: Props) {
  return (
    <Row className={css.container}>
      <Col className={css.year}>{props.year}</Col>
      <Col>
        <p className={css.main_information}>{props.title}</p>
        <p>{props.description}</p>
      </Col>
    </Row>
  );
}
