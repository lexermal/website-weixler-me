

# (DRAFT) Install Static site hosting

```yaml
version: '3.7'

# Usage example: https://github.com/stilliard/docker-pure-ftpd/wiki/Docker-stack-with-Wordpress-&-FTP

services:
  ftp:
    image: stilliard/pure-ftpd
    ports:
      - "21:21"
      - "30000-30009:30000-30009"
    volumes:
      - "/nfs/mounts/data:/home/wtadmin01/"
      - "/nfs/mounts/passwd:/etc/pure-ftpd/passwd"
      - "/nfs/mounts/ssl:/etc/ssl/private/"
    environment:
      PUBLICHOST: "localhost"
      FTP_USER_NAME: admin
      FTP_USER_PASS: my-ftp-password
      FTP_USER_HOME: /home/admin
      ADDED_FLAGS: "--tls=2"
  web:
    image: nginx:alpine
    volumes:
      - /nfs/mounts/data:/data
      - /nfs/configs/nginx.conf:/etc/nginx/conf.d/default.conf
    deploy:
      labels:
       - "traefik.enable=true"
       - "traefik.http.routers.ws.rule=Host(`my-domain.com`)"
       - "traefik.http.routers.ws.tls.certresolver=le"
       - "traefik.http.routers.ws.entrypoints=websecure"
       - "traefik.http.services.ws.loadbalancer.server.port=80"
       - "traefik.http.services.ws.loadbalancer.passhostheader=true"
    networks:
     - proxy-main
  filebrowser:
    image: hurlenko/filebrowser
    user: "${UID}:${GID}"
    volumes:
      - /nfs/mounts/data:/data
      - /nfs/mounts/transfair:/config
    environment:
      - FB_BASEURL=/filebrowser
    deploy:
      labels:
       - "traefik.enable=true"
       - "traefik.http.routers.wsw.rule=Host(`ftp.my-domain.com`)"
       - "traefik.http.routers.wsw.tls.certresolver=le"
       - "traefik.http.routers.wsw.entrypoints=websecure"
       - "traefik.http.services.wsw.loadbalancer.server.port=8080"
       - "traefik.http.services.wsw.loadbalancer.passhostheader=true"
    networks:
     - proxy-main


networks:
  proxy-main:
    external: true
y
```

