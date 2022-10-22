# How to install Wordpress on a K3s Cluster



helm repo add wordpress https://charts.bitnami.com/bitnami



```
global:
    storageClass: longhorn
wordpressUsername: admin
wordpressPassword: my-admin-password
mariadb:
    auth:
        rootPassword: my-db-password
```

```
helm upgrade --install wordpress wordpress/wordpress -f values.yml -n wordpress --create-namespace
```

```
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: wordpress-route
  namespace: wordpress
spec:
  entryPoints:
    - websecure
  tls:
    certResolver: le
  routes:
    - match: Host(`wp.my-domain.com`)   # <--change domain
      kind: Rule
      services:
        - name: wordpress
          port: 80
```

## (optional) Connect WordPress with Authentik

Use this tutorial: https://goauthentik.io/integrations/services/wordpress/


