# Setup ArgoCD

```
helm repo add argo https://argoproj.github.io/argo-helm
```

```
repositories:
  sumday-helm-repo:
    url: https://registry.my-domain.com
    name: My_Registry
    type: helm
    username: my-user
    password: my-password
server:
  ingress:
    enabled: true
    ingressClassName: traefik
    annotations:
      traefik.ingress.kubernetes.io/router.entrypoints: websecure
      traefik.ingress.kubernetes.io/router.tls.certResolver: le
    hosts:
    - argocd.my-domain.com
configs:
  params:
    server:
      insecure: true
```

```
kubectl --namespace argocd get secret argocd-initial-admin-secret -o json | jq -r '.data.password' | base64 -d
```

## References
* Tutorial for K3s without HELM https://blog.differentpla.net/blog/2022/02/02/argocd/
* ArgoCD Getting Started guide https://argo-cd.readthedocs.io/en/stable/getting_started/#1-install-argo-cd
* Defualt values https://artifacthub.io/packages/helm/argo/argo-cd?modal=values&path=server.ingress
