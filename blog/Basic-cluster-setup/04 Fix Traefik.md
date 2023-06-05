# Enhance Traefik
In order to use Traefik in a comfortable way the following we will configure:
* External ip to internal routing
* Automatic http to https forward
* TLS certificates using DNS challenge from Let's encrypt
* Wildcard certificates for all domains

To do this create the file **traefik-fix.yml** with the following content:
```yaml
apiVersion: helm.cattle.io/v1
kind: HelmChartConfig
metadata:
  name: traefik
  namespace: kube-system
spec:
  valuesContent: |-
    service:
      spec:
        # this forwards the real source ip to internal services
        externalTrafficPolicy: Local

    # enable https forwarding
    ports:
      websecure:
        tls:
          enabled: true
      web:
        redirectTo: websecure

    # enable tls challenges for whole subdomains
    additionalArguments:
      - "--log.level=DEBUG"
      - "--certificatesresolvers.le.acme.email=contact@my-domain.com"  # <- your contact email adress
      - "--certificatesresolvers.le.acme.storage=/data/acme.json"
      - "--certificatesresolvers.le.acme.tlschallenge=true"
      - "--certificatesresolvers.le.acme.dnschallenge.provider=hosttech" # <- change to your dns provider
      - "--certificatesresolvers.le.acme.dnschallenge.delaybeforecheck=0"
      # enable wildcards
      - "--entrypoints.websecure.http.tls=true"
      - "--entrypoints.websecure.http.tls.certResolver=le"
      - "--entrypoints.websecure.http.tls.domains[0].main=my-domain.com"          # <- change to your domain(s)
      - "--entrypoints.websecure.http.tls.domains[0].sans=*.my-domain.com"        # <- change to your domain(s)
      - "--entrypoints.websecure.http.tls.domains[1].main=sub.my-domain.com"      # <- change to your domain(s)
      - "--entrypoints.websecure.http.tls.domains[1].sans=*.sub.my-domain.com"    # <- change to your domain(s)
    env:
      - name: HOSTTECH_API_KEY   # <- change to your dns provider
        value: my-api-token      # <- change to your access token
```

Apply the config with ```kubectl apply -f traefik-fix.yml```



## Make Traefik accessible publically
By default the Traefik dashboard is active but not exposed. To make it securly available we using basic auth.

First generate a secret called
```htpasswd -nb my-admin-user my-password | openssl base64```

Insert the password hash in the following config file and adapt the domain name on which Traefik will be available.
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: traefik-basic-auth-secret
  namespace: kube-system
data:
  users: |2
    my-password-hash           # <- insert here your password hash
---
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: traefik-basic-auth
  namespace: kube-system
spec:
  basicAuth:
    secret: traefik-basic-auth-secret
---
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: dashboard
  namespace: kube-system
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`traefik.my-domain.com`)   # <- change to your domain
      kind: Rule
      middlewares:
        - name: traefik-basic-auth
          namespace: kube-system
      services:
        - name: api@internal
          kind: TraefikService
```

Apply the config with ```kubectl apply -f .```.


## References
* The way on how to redirect all http traffic to https is based on this answer https://stackoverflow.com/a/71989847/808723
* TLS config with external provider https://doc.traefik.io/traefik/https/acme/#dnschallenge
