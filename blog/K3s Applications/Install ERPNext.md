# Install ERPNext

```
helm repo add erpnext https://helm.erpnext.com
```


```
ingress:
  enabled: true
  className: traefik
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    traefik.ingress.kubernetes.io/router.tls.certResolver: le
  hosts:
  - host: erp.my-domain.com
    paths:
    - path: /
      pathType: ImplementationSpecific
persistence:
  worker:
   storageClass: longhorn
mariadb:
  auth:
    rootPassword: my-password  # <-- change
    password: my-password  # <-- change
    replicationPassword: my-password  # <-- change
createSite:
  enabled: true
  siteName: erp.my-domain.com
  adminPassword: my-password  # <-- change
```


```
helm upgrade --install erpnext erpnext/erpnext -f values.yml -n my-erpnext --create-namespace
```
