import { Card } from "react-bootstrap";
import css from "./CertificateCard.module.css";

interface Props {
  url: string;
  title: string;
  description?: string;
}

export default function CertificateCard(props: Props) {
  return (
    <Card className={css.card}>
      <div
        className={"card-img-top " + css.image}
        style={{ backgroundImage: `url('${props.url}')` }}
      ></div>
      <Card.Body className={css.body}>
        <Card.Title>{props.title}</Card.Title>
        {props.description ? <Card.Text>{props.description}</Card.Text> : ""}
      </Card.Body>
    </Card>
  );
}
