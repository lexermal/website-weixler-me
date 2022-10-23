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

helm repo add outline https://gitlab.com/api/v4/projects/30221184/packages/helm/stable/


Generate a secret key and utils key with ```openssl rand -hex 3```

```
secretKey: "my-secret-key"
utilsSecret: "my-utils-key"
ingress:
  host: outline.my-domain.com
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

## Make Outline available online
```
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: outline-route
  namespace: outline
spec:
  entryPoints:
    - websecure
  tls:
    certResolver: le
  routes:
    - match: Host(`outline.my-domain.com`)   # <--change domain
      kind: Rule
      services:
        - name: outline
          port: 80
```

kubectl apply -f ingress.yml


```
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: outline-minio-route
  namespace: outline
spec:
  entryPoints:
    - websecure
  tls:
    certResolver: le
  routes:
    - match: Host(`data.outline.my-domain.com`)   # <--change domain
      kind: Rule
      services:
        - name: outline-minio
          port: 9000
```

kubectl apply -f ingress.yml


## References
* Helm info https://artifacthub.io/packages/helm/outline/outline