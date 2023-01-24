# Install Heimdall

We are going to setup Heimdall behind an Authentik Middleware to make it securelly available.



## Configure Authentik

Make a Provider with the following settings:
* Provider: Proxy Provider
* Name: Heimdall
* Autheorization flow: implicit
* Forward type: Forward auth (single application)
* External host: https://home.my-domain.com

Create an application with the following settings:
* Name: Heimdall
* Provider: heimdall
* Launch URL: https://home.my-domain.com

Create an Outpost:
* Name: heimdall-outpost
* Type: Proxy
* Application: Heimdall


## Create middleware

To make Heimdall securelly available we need to create a middleware:

```yaml
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: middlewares-authentik
  namespace: my-heimdall   # <-- change
spec:
  forwardAuth:
    address: https://home.my-domain.com/outpost.goauthentik.io/auth/traefik  #<--change domain
    trustForwardHeader: true
    authResponseHeaders:
      - X-authentik-username
      - X-authentik-groups
      - X-authentik-email
      - X-authentik-name
      - X-authentik-uid
      - X-authentik-jwt
      - X-authentik-meta-jwks
      - X-authentik-meta-outpost
      - X-authentik-meta-provider
      - X-authentik-meta-app
      - X-authentik-meta-version
```

Deploy the middleware with ```kubectl apply -f .```

## Setup Heimdalll

Add the repository with
```
helm repo add djjudas21 https://djjudas21.github.io/charts/
```

Create a file called **values.yml** with the settings of heimdall like this one:
```yaml
persistence:
  config:
    enabled: true
ingress:
  main:
    enabled: true
    annotations:
      traefik.ingress.kubernetes.io/router.entrypoints: websecure
      traefik.ingress.kubernetes.io/router.tls.certResolver: le
      traefik.ingress.kubernetes.io/router.middlewares: my-heimdall-middlewares-authentik@kubernetescrd  # change namespace
    hosts:
      - host: home.my-domain.com     # <-- change
        paths:
          - path: "/"
            pathType: Prefix
```

Install Heimdall with:
```
helm upgrade --install heimdall djjudas21/heimdall -f values.yml -n my-heimdall --create-namespace
```

Heimdall is now available via https://home.my-domain.com




## Ressources
* Docu for Middleware https://goauthentik.io/docs/providers/proxy/forward_auth
* Heimdall Helm charts https://artifacthub.io/packages/helm/djjudas21/heimdall
