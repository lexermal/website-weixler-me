import { Col, Row } from "react-bootstrap";
import Circle from "../Circle/Circle";
import css from "./PortfolioRating.module.css";

interface Props {
  title: string;
  percentage: number;
  totalDots?: number;
}

export default function PortfolioRating(props: Props) {
  const totalDots = props.totalDots || 15;

  return (
    <Row className={css.container}>
      <Col className={css.title}>{props.title}</Col>
      <Col>
        {[...Array(totalDots).keys()].map((_, index) => (
          <Circle
            key={index}
            full={(100 / totalDots) * index < props.percentage}
          />
        ))}
      </Col>
    </Row>
  );
}
