import { Col, Container, Row } from "react-bootstrap";
import { Flag, MegaphoneFill, PersonFill } from "react-bootstrap-icons";
import CertificateCard from "../../components/CertificateCard/CertificateCard";
import ContactButton from "../../components/ContactButton/ContactButton";
import PortfolioEntry from "../../components/PortfolioEntry/PortfolioEntry";
import PortfolioRating from "../../components/PortfolioRating/PortfolioRating";
import { ProjectCard } from "../../components/ProjectCard/ProjectCard";
import SectionHeading from "../../components/SectionHeading/SectionHeading";

export default function Portfolio() {
  return (
    <>
      <SectionHeading title="Portfolio" anchor="portfolio" />
      {renderGeneralInfos()}

      {renderEducation()}
      {renderCareer()}

      {renderCertificates()}

      {renderSoftSkills()}
      {renderHardSkills()}

      {renderHobbies()}

      {renderContact()}
    </>
  );
}

function renderEducation() {
  return (
    <Container data-aos="fade-up" className="mt-5">
      <h1>Education</h1>

      <PortfolioEntry
        year={2018}
        title={"Completed higher technical collage in Kaindorf, Austria"}
        description={"Field of study: Computer science"}
      />
      <PortfolioEntry
        year={2022}
        title={"Completed university of applied sciences at Campus 02, Austria"}
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
    <Container data-aos="fade-up" className="mt-5">
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

function renderCertificates() {
  return (
    <Container data-aos="fade-up" className="mt-5">
      <h1>Certificates</h1>
      <Row>
        <CertificateCard url="/pictures/cisco.png" title="Cisco CCNA" />
        <CertificateCard url="/pictures/efqm.png" title="EFQM Assessor" />
        <CertificateCard
          url="/pictures/value_management.png"
          title="Value Management"
        />
      </Row>
    </Container>
  );
}

function renderSoftSkills() {
  return (
    <Container data-aos="fade-up" className="mt-5">
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
    <Container data-aos="fade-up" className="mt-5">
      <h1>Hard skills</h1>

      <PortfolioRating title="Docker" percentage={85} />
      <PortfolioRating
        title="Devops (CI/CD, load balancing, Scaling,...)"
        percentage={80}
      />
      <PortfolioRating title="Javascript / Typescript" percentage={90} />
      <PortfolioRating title="React" percentage={80} />
      <PortfolioRating title="Kubernetes(currently learning)" percentage={40} />
      <PortfolioRating title="Network Technology (Cisco)" percentage={80} />
      <PortfolioRating title="Flutter(currently learning)" percentage={50} />
      <PortfolioRating title="Linux" percentage={70} />
      <PortfolioRating
        title="Relational databases (MySQL, OracleDB, PostgreSQL,...)"
        percentage={85}
      />
      <PortfolioRating
        title="NoSQL Databases (MongoDB, Cassandra, Redis)"
        percentage={85}
      />
      <PortfolioRating title="WebAPIs (REST, GraphQL, ...)" percentage={80} />
      <PortfolioRating title="PHP, Java" percentage={80} />
      <PortfolioRating title="C#, C, C++" percentage={60} />
    </Container>
  );
}

function renderGeneralInfos() {
  return (
    <>
      <Container data-aos="fade-up" className="mt-5">
        <h3>&#8220;Life isn&apos;t complicated. Try, fail, learn and win!”</h3>
      </Container>

      <Container
        data-aos="fade-up"
        className="mt-2"
        style={{ fontSize: "22px" }}
      >
        <Row>
          <Col>
            <Flag size={25} /> Austria
          </Col>
          <Col>
            <PersonFill size={25} /> {new Date().getFullYear() - 1997} years old
          </Col>
        </Row>
        <Row>
          <Col>
            <MegaphoneFill size={25} /> <span>English, German</span>
          </Col>
        </Row>
      </Container>
    </>
  );
}

function renderHobbies() {
  return (
    <Container data-aos="fade-up" className="mt-5">
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
        <ContactButton />
      </Row>
    </Container>
  );
}
