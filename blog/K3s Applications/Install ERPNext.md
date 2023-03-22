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
jobs:
  createSite:
    enabled: true
    siteName: erp.my-domain-com    # <-- change
    adminPassword: my-password  # <-- change
```


```
helm upgrade --install erpnext erpnext/erpnext -f values.yml -n my-erpnext --create-namespace
```
Wait till all pods are running, then give the application 5 min to initialize.

You can now enter the page via https://erp.my-domain.com

Username: Administrator
Password: the one you set in values.yml

## References
* Helm chart config https://artifacthub.io/packages/helm/erpnext/erpnext?modal=values&path=persistence
* User credentials https://verystrongfingers.github.io/erpnext/2021/02/11/erpnext-k3s.html
* Job creation details https://github.com/frappe/helm/blob/main/erpnext/README.md
