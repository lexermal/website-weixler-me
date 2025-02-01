# Install Bookstack

## Install the application
```helm repo add gabe565 https://charts.gabe565.com```

Generate an app key with 
```bash
docker run -it --rm --entrypoint /bin/bash lscr.io/linuxserver/bookstack:latest appkey
```

Create the file values.yml and insert the following contend:
```
env:
  APP_KEY=my-app-key     <-- change
ingress:
  main:
    enabled: true
    className: traefik
    annotations:
      cert-manager.io/cluster-issuer: letsencrypt-production
    hosts:
      - host: wiki.my-domain.com     <-- change
        paths:
          - path: /
            pathType: Prefix
    tls:
      - secretName: bookstack-tls
      - hosts:
        - wiki.my-domain.com     <-- change
persistence:
  config:
    enabled: true
    storageClass: longhorn
mariadb:
  enabled: true
  auth:
    password: my-password     <-- change
    rootPassword: my-password     <-- change
  primary:
    persistence:
      enabled: true
      storageClass: longhorn
```
Install and upgrade the application with:
```helm upgrade -i bookstack gabe565/bookstack -f values.yml -n wiki --create-namespace```

## (optional) Connect to SSO provider


## References
* Default values.yml https://artifacthub.io/packages/helm/gabe565/bookstack?modal=values
* SAML tutorial https://bookstackapp.com/docs/admin/saml/
* App key command https://docs.linuxserver.io/images/docker-bookstack/#ports-p
* Full Bookstack env https://github.com/BookStackApp/BookStack/blob/release/.env.example.complete
