# Install Lightweight Reverse Proxy

In this tutorial I'm showing you hwo to create an easy docker reverse proxy with SSL.

Simply copy this docker compose file and you have it running. Use the hello world container as reference for your containers.

```yaml
services:
    nginx:
        container_name: nginx
        image: nginxproxy/nginx-proxy
        restart: unless-stopped
        ports:
            - 80:80
            - 443:443
        volumes:
            - /var/run/docker.sock:/tmp/docker.sock:ro
            - /mnt/backup_drive/docker/mounts/nginx_proxy/html:/usr/share/nginx/html
            - /mnt/backup_drive/docker/mounts/nginx_proxy//certs:/etc/nginx/certs
            - /mnt/backup_drive/docker/mounts/nginx_proxy/vhost:/etc/nginx/vhost.d
        networks:
            - domain_network
    letsencrypt-companion:
        container_name: letsencrypt-companion
        image: nginxproxy/acme-companion
        restart: unless-stopped
        volumes_from:
            - nginx
        volumes:
            - /var/run/docker.sock:/var/run/docker.sock
            - /mnt/backup_drive/docker/mounts/nginx_proxy/acme:/etc/acme.sh
        environment:
            DEFAULT_EMAIL: contact@my-domain.com
        networks:
            - domain_network

    hello-world:
        container_name: hello-world
        image: nginx
        expose:
            - "8080"
        environment:
            VIRTUAL_HOST: test.my-domain.com
            LETSENCRYPT_HOST: test.my-domain.com
            VIRTUAL_PORT: 80
        networks:
            - domain_network

networks:
  domain_network:
    attachable: true
    name: domain_network
```

## References
* Base tutorial https://www.programonaut.com/how-to-automate-ssl-with-docker-and-nginx/
* New letsencrypt container https://github.com/nginx-proxy/acme-companion
* 
