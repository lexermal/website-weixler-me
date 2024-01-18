# Enhance Traefik
To use Traefik in a comfortable way the following we will configure:
* External IP to internal routing
* Automatic HTTP to HTTPS forward

To do this, create the file **traefik-fix.yml** with the following content:
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
        redirectTo:
          port: websecure

    # enable tls challenges for whole subdomains
    additionalArguments:
      - "--log.level=DEBUG"
```

Apply the config with ```kubectl apply -f traefik-fix.yml```

## (optional) Make Traefik dashboard accessible
By default, the Traefik dashboard is active but not exposed. To make it securely available we use basic auth.

First, generate a secret called
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
* The way how to redirect all HTTP traffic to HTTPS is based on this answer https://stackoverflow.com/a/71989847/808723
* TLS config with external provider https://doc.traefik.io/traefik/https/acme/#dnschallenge
