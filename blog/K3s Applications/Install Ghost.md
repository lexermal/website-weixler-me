# Install Ghost

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
```


```yaml
clusterDomain: home.my-domain.com
ghostUsername: admin
ghostPassword: my-password
ghostBlogTitle: My-Blog
ghostHost: home.my-domain.com
ingress:
  enabled: true
  hostname: home.my-domain.com
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    traefik.ingress.kubernetes.io/router.tls.certResolver: le
  ingressClassName: traefik
mysql:
  auth: 
    rootPassword: my-password
    password: my-password
```



````bash
helm upgrade --install ghost bitnami/ghost -f values.yml -n ghost --create-namespace
```

## References
* Deployment infos https://artifacthub.io/packages/helm/bitnami/ghost
