# Install Retrospective Tool Scrumlr

https://scrumlr.io/ is an awesome retrospective tool that is open source.

This is how you can set it up:

Create a file called **docker-compose.yml** and paste in the following contend:
```
version: "3.9"

name: scrumlr
services:

  nats:
    container_name: "scrumlr-nats-1"
    image: nats:2-alpine
    ports:
      - "4222:4222"
    healthcheck:
      test: [ "CMD", "ping", "nats", "-c", "2" ]
      start_period: 5s
      interval: 10s
      timeout: 5s
      retries: 10
    networks:
      - domain_network

  database:
    container_name: "scrumlr-database-1"
    image: postgres:14.1
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: &db_user "admin"
      POSTGRES_PASSWORD: "supersecret"
      POSTGRES_DB: &db_name "scrumlr"
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    healthcheck:
      test: [ "CMD", "pg_isready", "-q", "-d", *db_name, "-U", *db_user ]
      start_period: 10s
      interval: 10s
      timeout: 5s
      retries: 10
    networks:
     - domain_network

  scrumlr:
    container_name: "scrumlr-backend"
    image: ghcr.io/inovex/scrumlr.io/scrumlr-server:sha-be0781f
    command: ./main --disable-check-origin
    ports:
      - "8080:8080"
    environment:
      SCRUMLR_SERVER_PORT: 8080
      SCRUMLR_SERVER_NATS_URL: "nats://scrumlr-nats-1:4222"
      SCRUMLR_SERVER_DATABASE_URL: "postgres://admin:supersecret@scrumlr-database-1:5432/scrumlr?sslmode=disable"
    depends_on:
      database:
        condition: service_healthy
      nats:
        condition: service_healthy
    networks:
     - domain_network

  scrumlr-frontend:
    image: ghcr.io/inovex/scrumlr.io/scrumlr-frontend:sha-be0781f
    ports:
      - "80:80"
    environment:
      SCRUMLR_SERVER_URL: "http://localhost:8080"
      SCRUMLR_WEBSOCKET_URL: "ws://localhost:8080"
      PUBLIC_URL: http://localhost:80
    networks:
      - domain_network

networks:
    domain_network:
        name: docker_network
```

Deploy the application with ```docker compose up -d```.

Now you can access it via http://your-host-ip/
