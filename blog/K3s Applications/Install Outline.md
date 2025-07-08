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

```
helm repo add community-charts https://community-charts.github.io/helm-charts
```

Create a values.yml file with the following content:
```
autoUpdate:
  enabled: true
postgresql:
  enabled: true
  auth:
    username: outline
    password: my-password          # change
    database: outline
  primary:
    persistence:
      enabled: true
      size: 8Gi
      storageClass: longhorn
redis:
  enabled: true
  auth:
    enabled: true
  master:
    persistence:
      enabled: true
      size: 8Gi
      storageClass: longhorn
fileStorage:
  mode: local
  local:
    persistence:
      enabled: true
      size: 8Gi
      storageClass: longhorn
auth:
  oidc:
    enabled: true
    clientId: my-client-id          # change
    clientSecret: my-client-secret  # change
    authUri: https://auth.my-domain.com/application/o/authorize/       # change domain
    tokenUri: https://auth.my-domain.com/application/o/token/          # change domain
    userInfoUri: https://auth.my-domain.com/application/o/userinfo/    # change domain
    displayName: Authentik
    usernameClaim: email
ingress:
  enabled: true
  className: traefik
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-production
  hosts:
    - host: outline.my-domain.com  # change domain
      paths:
        - path: /
          pathType: ImplementationSpecific
  tls:
    - secretName: outline-tls
      hosts:
        - outline.my-domain.com  # change domain
```

Install Outline with:

```
helm upgrade --install outline community-charts/outline -f values.yml -n outline --create-namespace
```


## References
* Helm info https://artifacthub.io/packages/helm/community-charts/outline
