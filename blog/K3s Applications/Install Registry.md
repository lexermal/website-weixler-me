# Install official docker registry

```helm repo add twuni https://helm.twun.io```

```
persistence:
  enabled: true
secrets:
  haSharedSecret: "your-password"
  htpasswd: "your-password"
```
  
```
  apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: registry-ingress
  namespace: my-registry
spec:
  entryPoints:
    - websecure
  tls:
    certResolver: le
  routes:
    - match: Host(`registry.my-domain.com`) # <-- domain name for Dynmap
      kind: Rule
      services:
        - name: registry-docker-registry
          port: 5000
```
  
```helm upgrade --install registry twuni/docker-registry -f values.yml -n my-registry --create-namespace```
