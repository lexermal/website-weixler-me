import { Button, Card, Col, Container, Row } from "react-bootstrap";
import PortfolioEntry from "../../components/PortfolioEntry/PortfolioEntry";
import PortfolioRating from "../../components/PortfolioRating/PortfolioRating";
import { ProjectCard } from "../../components/ProjectCard/ProjectCard";
import SectionHeading from "../../components/SectionHeading/SectionHeading";

export default function Portfolio() {
  return (
    <>
      <SectionHeading title="Portfolio" />
      <h2>
        My Motto is: Life isn&apos;t complicated. Try, fail, learn and win!
      </h2>

      {renderEducation()}
      {renderCareer()}
      {renderSoftSkills()}
      {renderHardSkills()}
      {renderGeneralInfos()}
      {renderHobbies()}

      {renderContact()}
    </>
  );
}

function renderEducation() {
  return (
    <Container data-aos="fade-up">
      <h1>Education</h1>

      <PortfolioEntry
        year={2018}
        title={"Completed higher technical collage"}
        description={"Field of study: Computer science"}
      />
      <PortfolioEntry
        year={2022}
        title={"Completed university of applied sciences"}
        description={"Field of study: Innovation management"}
      />
      <PortfolioEntry
        year={2022}
        title={"Started master program in Sweden"}
        description={"International Entrepreneurship"}
      />
    </Container>
  );
}

function renderCareer() {
  return (
    <Container data-aos="fade-up">
      <h1>Career</h1>

      <PortfolioEntry
        year={"2018 - 2019"}
        title={"Leftshift One Software GmbH"}
        description={"Software developer"}
      />
      <PortfolioEntry
        year={"2019 - 2020"}
        title={"Leftshift One Software GmbH"}
        description={"IT project manager"}
      />
      <PortfolioEntry
        year={"2020 - 2022"}
        title={"Efkon GmbH"}
        description={"IT project manager"}
      />
    </Container>
  );
}

function renderSoftSkills() {
  return (
    <Container data-aos="fade-up">
      <h1>Soft skills</h1>

      <PortfolioRating title="Rhetorics" percentage={90} />
      <PortfolioRating title="Creativity" percentage={90} />
      <PortfolioRating title="Flexibility" percentage={90} />
      <PortfolioRating title="Reliability" percentage={100} />
      <PortfolioRating title="Teamwork" percentage={90} />
      <PortfolioRating title="Resilience" percentage={90} />
      <PortfolioRating title="Autonomy" percentage={100} />
    </Container>
  );
}

function renderHardSkills() {
  return (
    <Container data-aos="fade-up">
      <h1>Hard skills</h1>

      <PortfolioRating title="Docker" percentage={90} />
      <PortfolioRating
        title="Devops (CI/CD, load balancing, Scaling,...)"
        percentage={80}
      />
      <PortfolioRating title="Javascript / Typescript" percentage={100} />
      <PortfolioRating title="React" percentage={100} />
      <PortfolioRating title="Linux" percentage={90} />
      <PortfolioRating
        title="Databases (MySql, OracleDB, PostgreSQL,...)"
        percentage={100}
      />
      <PortfolioRating title="Network Technology (Cisco)" percentage={100} />
      <PortfolioRating title="Flutter(currently learning)" percentage={50} />
      <Row>
        <Col>
          Additional Skills: PHP, Java, C#, C, C++, NodeJS, NoSQL Databases
          (MongoDB, Cassandra), Kubernetes, WebAPIs (REST, GraphQL, ...), Linux
        </Col>
      </Row>
    </Container>
  );
}

function renderGeneralInfos() {
  return (
    <Container data-aos="fade-up">
      <h1>Short facts</h1>
      <Row>
        <Col>Nationality: Austria</Col>
        <Col>Age: {new Date().getFullYear() - 1997} years</Col>
        <Col>Fluently speaking languages: English, German</Col>
      </Row>
    </Container>
  );
}

function renderHobbies() {
  return (
    <Container data-aos="fade-up">
      <h1>Hobbies</h1>
      <Row>
        <Col>
          <ProjectCard
            name="Group sports"
            description="Sport is a important part of life and I practive Volleyball, Badmington and Sqash on aregular bases."
            url={""}
          />
        </Col>
        <Col>
          <ProjectCard
            name="Hiking"
            description="I'm on a hiking tour across whole Austria. Every year I go one stage."
            url=""
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <ProjectCard
            name="Writing"
            description="I'm writing down stories about the things I experience throughout the year."
            url={""}
          />
        </Col>
        <Col>
          <ProjectCard
            name="Self hosting"
            description="I love to selfhost my applications and try out new ways to automate my infrastructure."
            url={""}
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <ProjectCard
            name="Climping"
            description="Finally reaching the top of the mountain through the climbling route is fascinating."
            url={""}
          />
        </Col>
        <Col></Col>
      </Row>
    </Container>
  );
}

function renderContact() {
  return (
    <Container data-aos="zoom-in">
      <Row>
        <Col>
          <Button>Contact now</Button>
        </Col>
      </Row>
    </Container>
  );
}
