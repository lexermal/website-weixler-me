# Setup K3s






## Make Traefik available from outside
By default Traefik is exposed but only to the IP used at setting up the cluster. When the cluster communicates with its nodes over WireGuard, the exposed IP is the one set from WireGuard and that one is a private one(like 10.1.1.1).

To fix this create the following config file and change the public ip, the dns provider and the api token to your needs.
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
      externalIPs:
        - 1.1.1.1  # <- change to your public ip

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
    env:
      - name: HOSTTECH_API_KEY   # <- change to your dns provider
        value: my-api-token      # <- change to your access token
```

Apply the config with ```kubectl apply -f .```.

The way on how to redirect everything to https is based on this answer https://stackoverflow.com/a/71989847/808723


## Make Traefik accessible publically

To make Traefik accessible in a save way we are using basic auth.

First generate a secret called
```htpasswd -nb my-admin-user my-password | openssl base64```

Insert the password hash in the following config and adapt the domain name on which traefik will be available.

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
  tls:
    certResolver: le
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


