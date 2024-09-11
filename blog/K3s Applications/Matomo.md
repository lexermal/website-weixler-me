# Install Matomo

Create a file called **values.yml** with the following content and adapt it to your needs:

```yaml
global:
  storageClass: longhorn
matomoUsername: mt-admin
matomoPassword: my-password                       # <-- change
matomoWebsiteName: My Website Title               # <-- change
matomoWebsiteHost: https://matomo.my-domain.com       # <-- change
hostAliases:
  - ip: "127.0.0.1"
    hostnames:
      - "matomo.my-domain.com"         # <-- change
persistence:
  storageClass: longhorn
ingress:
  enabled: true
  ingressClassName: traefik
  hostname: matomo.my-domain.com        # <-- change
  tls: true
mariadb:
  auth:
    rootPassword: my-password           # <-- change 
    password: my-password               # <-- change
  primary:
    persistence:
      storageClass: longhorn
service:
  type: ClusterIP
```
Run the following command to install Matomo
```bash
helm upgrade -i matomo oci://registry-1.docker.io/bitnamicharts/matomo -f values.yml -n matomo --create-namespace
```

## References
* Matomo HELM values https://artifacthub.io/packages/helm/bitnami/matomo?modal=values
