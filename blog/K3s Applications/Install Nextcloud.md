# Install Nextcloud

```
helm repo add nextcloud https://nextcloud.github.io/helm/
```

```
image:
    tag: "24.0.5"

nextcloud:
    host: "cloud.weixler.me"
    password: "H9wjXg5aajWQGz"

mariadb:
    enabled: true
    password: "mPx6NQ3VD3R97R"

cronjob:
    enabled: true

persistence:
    enabled: true
    storageClass: longhorn
    nextcloudData:
        enabled: true
        storageClass: longhorn
        size: 500Gi

phpClientHttpsFix:
    enabled: true
```


helm upgrade --install nextcloud nextcloud/nextcloud -f values.yaml -n nextcloud --create-namespace


kubectl get service --namespace nextcloud

```
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: nextcloud-route
  namespace: nextcloud
spec:
  entryPoints:
    - websecure
  tls:
    certResolver: le
  routes:
    - match: Host(`cloud.my-domain.com`)   # <--change domain
      kind: Rule
      services:
        - name: nextcloud
          port: 8080
```

kubectl apply -f ingress.yml


## (optional) Connect Nextcloud with Authentik

https://blog.cubieserver.de/2022/complete-guide-to-nextcloud-saml-authentication-with-authentik/

Hint: The Metadata stays always invalid.

When an error occures that the **user is not provisioned**, close the browser window and access https://cloud.my-domain.com again after 5 minutes.


## Reclaimer
Tutorial is based on https://artifacthub.io/packages/helm/nextcloud/nextcloud#configuration