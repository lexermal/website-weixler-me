# Install Ghost

```bash
helm repo add groundhog2k https://groundhog2k.github.io/helm-charts/
```


```yaml
image:
  tag: 5
ingress:
  enabled: true
  annotations:
    kubernetes.io/ingress.class: traefik
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    traefik.ingress.kubernetes.io/router.tls.certResolver: le  
  hosts:
    - host: home.my-domain.com
      paths:
        - /
settings:
  url: https://home.my-domain.com
mariadb:
  enabled: true
  settings:
    rootPassword: my-password
  userDatabase:
    name: ghost
    user: ghadmin
    password: my-password
```



```bash
helm upgrade --install ghost groundhog2k/ghost -f values.yml -n ghost --create-namespace
```

Now you can setup the page via https://home.my-domain.com/ghost

## References
* Deployment infos [https://artifacthub.io/packages/helm/bitnami/ghost](https://artifacthub.io/packages/helm/groundhog2k/ghost)
