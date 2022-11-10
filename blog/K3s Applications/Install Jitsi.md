```bash
helm repo add gradiant-openverso https://gradiant.github.io/openverso-charts/
```


```yaml
enableAuth: false
enableGuests: true
publicURL: "https://meet.my-domain.com"
jibri:
  recorder:
    password: my-password
  xmpp:
    password: my-password
jicofo:
  xmpp:
    password: my-password
jvb:
  xmpp:
    password: my-password
```

```bash
helm upgrade --install jitsi gradiant-openverso/jitsi -f values.yml -n jitsi --create-namespace
```
## Configure Authentik

Make a Provider with the following settings:
* Provider: Proxy Provider
* Name: jitsi
* Autheorization flow: implicit
* Forward type: Forward auth (single application)
* External host: https://meet.my-domain.com

Create an application with the following settings:
* Name: jitsi
* Provider: jitsi
* Launch URL: https://meet.my-domain.com

Create an Outpost:
* Name: jitsi-outpost
* Type: Proxy
* Application: jitsi




## Make Jitsi available
Create a middleware:

```yaml
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: middlewares-authentik
  namespace: jitsi
spec:
  forwardAuth:
    address: https://meet.my-domain.com/outpost.goauthentik.io/auth/traefik  #<--change domain
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




```yaml
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: my-jitsi-route
  namespace: jitsi
spec:
  entryPoints:
    - websecure
  tls:
    certResolver: le
  routes:
    - match: Host(`meet.my-domain.com`)   # <--change domain
      kind: Rule
      middlewares:
        - name: middlewares-authentik
      services:
        - name: jitsi-web
          port: 80
```

```kubectl apply -f .```


## References
* Deployment details https://artifacthub.io/packages/helm/gradiant-openverso/jitsi?modal=install