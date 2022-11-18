```
helm repo add djjudas21 https://djjudas21.github.io/charts/
```


```
persistence:
  config:
    enabled: true
```

```
helm upgrade --install heimdall djjudas21/heimdall -f values.yml -n my-heimdall --create-namespace
```

Heimdall will be available via https://home.my-domain.com


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




## Make Heimdall available

```
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: middlewares-authentik
  namespace: my-heimdall
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




```
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: my-heimdall-route
  namespace: my-heimdall
spec:
  entryPoints:
    - websecure
  tls:
    certResolver: le
  routes:
    - match: Host(`home.my-domain.com`)   # <--change domain
      kind: Rule
      middlewares:
        - name: middlewares-authentik
      services:
        - name: heimdall
          port: 80
```

```kubectl apply -f .```




## Ressources
* https://goauthentik.io/docs/providers/proxy/forward_auth