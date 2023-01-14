# Setup Outline

## Configure Authentik

Create a new OAuth2/OpenID Provider with the following values:
* Name: Outline
* Authorization flow: Implicit
* Redirect Urls: https://outline.my-domain.com/auth/oidc.callback

Create an application with the following values:
* Name: Outline
* Slug: outline
* Provider: outline

## Install Outline

```helm repo add outline https://gitlab.com/api/v4/projects/30221184/packages/helm/stable/```


Generate a secret key and utils key with ```openssl rand -hex 3```

```
secretKey: "my-secret-key"
utilsSecret: "my-utils-key"
ingress:
  host: outline.my-domain.com
  annotations:
    kubernetes.io/ingress.class: traefik
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    traefik.ingress.kubernetes.io/router.tls.certResolver: le
  tls:
    enabled: true
env:
  OIDC_CLIENT_ID: outline
  OIDC_CLIENT_SECRET: my-client-secret
  OIDC_AUTH_URI: https://auth.my-domain.com/application/o/authorize/
  OIDC_TOKEN_URI: https://auth.my-domain.com/application/o/token/
  OIDC_USERINFO_URI: https://auth.my-domain.com/application/o/userinfo/
  OIDC_USERNAME_CLAIM: email
  OIDC_DISPLAY_NAME: Authentik
postgresql:
  postgresqlPassword: "my-database-password"
  postgresqlPostgresPassword: "my-database-admin-password"
  persistence:
    storageClass: "longhorn"
    size: 6Gi
redis:
  persistence:
    storageClass: "longhorn"
    size: 3Gi
minio:
  ingress:
    hostname: "data.outline.my-domain.com"
    tls: true
    certManager: true
    annotations:
      kubernetes.io/ingress.class: traefik
      traefik.ingress.kubernetes.io/router.entrypoints: websecure
      traefik.ingress.kubernetes.io/router.tls.certResolver: le
  secretKey:
    password: "my-secret-key"
  accessKey:
    password: "my-access-key"
  persistence:
    storageClass: "longhorn"
    size: 30Gi
```

```
helm upgrade --install outline outline/outline -f values.yml -n outline --create-namespace
```


## References
* Helm info https://artifacthub.io/packages/helm/outline/outline
