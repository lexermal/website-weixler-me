# Install Odoo

```helm repo add bitnami https://charts.bitnami.com/bitnami```

```
odooEmail: odoo@my-domain.com   # <-- change
odooPassword: my-password   # <-- change
ingress:
  enabled: true
  ingressClassName: traefik
  hostname: odoo.my-domain.com   # <-- change
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    traefik.ingress.kubernetes.io/router.tls.certResolver: le
postgresql:
  auth:
    password: my-db-password    # <-- change
```

```helm upgrade --install odoo bitnami/odoo -f values.yml -n my-odoo --create-namespace```

## References
* Setup instructions https://artifacthub.io/packages/helm/bitnami/odoo
* Explaination of config parameters https://github.com/bitnami/containers/tree/main/bitnami/odoo#configuration
