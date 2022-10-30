# Setup Mattermost




```yaml
version: "3.9"

services:
  postgres:
    image: postgres:13-alpine
    container_name: mattermost-postgres
    restart: always
    security_opt:
      - no-new-privileges:true
    pids_limit: 100
    read_only: true
    tmpfs:
      - /tmp
      - /var/run/postgresql
    volumes:
      - ./postgres:/var/lib/postgresql/data
    environment:
      - TZ=UTC
      - POSTGRES_USER=user1
      - POSTGRES_PASSWORD=my-database-password
      - POSTGRES_DB=mattermost
    networks:
      - mattermost_nw

  mattermost:
    depends_on:
      - postgres
    image: mattermost/mattermost-team-edition
    restart: always
    security_opt:
      - no-new-privileges:true
    pids_limit: 200
    tmpfs:
      - /tmp
    volumes:
      - ./config:/mattermost/config
      - ./data:/mattermost/data
      - ./logs:/mattermost/logs
      - ./plugins:/mattermost/plugins
      - ./client-plugins:/mattermost/client/plugins
      - ./bleve-indexes:/mattermost/bleve-indexes
      # When you want to use SSO with GitLab, you have to add the cert pki chain of GitLab inside Alpine
      # to avoid Token request failed: certificate signed by unknown authority
      # (link: https://github.com/mattermost/mattermost-server/issues/13059 and https://github.com/mattermost/docker/issues/34)
      # - ${GITLAB_PKI_CHAIN_PATH}:/etc/ssl/certs/pki_chain.pem:ro
    environment:
      - TZ=UTC
      - MM_SQLSETTINGS_DRIVERNAME=postgres
      - MM_SQLSETTINGS_DATASOURCE=postgres://user1:my-database-password@mattermost-postgres:5432/mattermost?sslmode=disable&connect_timeout=10
      - MM_BLEVESETTINGS_INDEXDIR=/mattermost/bleve-indexes
      - MM_SERVICESETTINGS_SITEURLhttps://mattamost.my-domain.com
    labels:
      - traefik.enable=true
      - traefik.http.routers.sc.rule=Host(`mattermost.my-domain.com`)
      - traefik.http.routers.sc.tls.certresolver=le
      - traefik.http.routers.sc.entrypoints=https
      - traefik.http.services.sc.loadbalancer.server.port=8065
      - traefik.docker.network=domain_network
    networks:
      - domain_network
      - mattermost_nw
networks:
    domain_network:
        external: true
    mattermost_nw:
        name: mattermost_nw
```

docker compose up -d



## References
* Official docs https://docs.mattermost.com/install/install-docker.html
* Docker compose example env file https://github.com/mattermost/docker/blob/main/env.example