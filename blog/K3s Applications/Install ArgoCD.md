# Setup ArgoCD

In this tutorial ArgoCD gets setup using Helm on a K3s cluster. The usecase is that in a Github repository all argo application configuration files lay. The applications that should be deployed via ArgoCD are Helm charts being in a private Helm registry.

Add the repository with:
```bash
helm repo add argo https://argoproj.github.io/argo-helm
```

Create a values.yml file that contains the following content. It configures 2 repositories as sources and template credentials for applications accessing the Application definition.
```yaml
repositories:
  my-helm-repo:
    url: https://registry.my-domain.com
    name: My_Registry
    type: helm
    username: my-user
    password: my-password
  my-git-repo:
    type: git
    url: https://github.com/my/repo.git
    name: ArgoCD_config_sync
    username: argocd
    password: my-github-access-token
server:
  ingress:
    enabled: true
    ingressClassName: traefik
    annotations:
      traefik.ingress.kubernetes.io/router.entrypoints: websecure
      traefik.ingress.kubernetes.io/router.tls.certResolver: le
    hosts:
    - argocd.my-domain.com
  extraArgs:
    - --insecure
#configs:
#  cm:
#    url: https://argocd.my-domain.com
#    dex.config: |
#        connectors:
#        - config:
#            issuer: https://auth.my-domain/application/o/argocd/
#            clientID: my-client-id
#            clientSecret: my-client-secret
#            insecureEnableGroups: true
#            scopes:
#              - openid
#              - profile
#              - email
#              - groups
#          name: Authentik
#          type: oidc
#          id: authentik
  credentialTemplates:
    https-creds:
      username: argocd
      password: my-github-access-token
      url: https://github.com/my/repo.git
```

Install ArgoCD with:
````bash
helm upgrade --install argocd argo/argo-cd -f values.yml -n argocd --create-namespace
```

Get the admin password with: 
```
kubectl --namespace argocd get secret argocd-initial-admin-secret -o json | jq -r '.data.password' | base64 -d
```

The admin interface of ArgoCD can now be accessed via https://argocd.my-domain.com

As shown in the UI there are no applications that get synched. This is because the Github repository needs to be added as Application. This can be done by creating this yaml file and deploying it:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-argo-sync
  namespace: argocd
spec:
  destination:
    namespace: argocd
    server: https://kubernetes.default.svc
  project: default
  source:
    path: .
    repoURL: https://github.com/my/repo.git
    targetRevision: HEAD
    directory:
      recurse: true
      exclude: '*.config.yml'
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

The configurations like ApplicationSets are now visible in the UI. 

An example Helm deployment ApplicationSet can look like this. It deploys the helm chart of Tyk, an API Gateway to the staging and production cluster.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: api-gateway
  namespace: argocd
spec:
  generators:
  - list:
      elements:
       - cluster: production
         url: https://cluster.production.my-domain.com
         values:
           helmVersion: ">=1.0.0 <2.0.0"
           password: my-producation-pw
           hostname: my-application.production.my-domain.com
           apiSecret: abc
      - cluster: staging
        url: https://kubernetes.default.svc
        values:
          helmVersion: ">=0.0.1"
          url: my-application.staging.my-domain.com
          password: my-staging-pw
          apiSecret: abc
  template:
    metadata:
      name: '{{cluster}}-application-name'
    spec:
      project: default
      destination:
        server: '{{url}}'
        namespace: my-namespace
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
      source:
        repoURL: https://helm.tyk.io/public/helm/charts/
        chart: tyk-headless
        targetRevision: '{{values.helmVersion}}'
        helm:
          values: |
            redis:
              addrs: '{{cluster}}-api-gateway-redis-master.api-gateway.svc.cluster.local:6379'
              pass: '{{values.redisPassword}}'
            secrets:
              APISecret: '{{values.apiSecret}}'
            backend: postgres
            gateway:
              hostname: '{{values.url}}'
              tls: true
              extraEnvs:
                - name: "TYK_GW_HTTPSERVEROPTIONS_SSLINSECURESKIPVERIFY"
                  value: "true"
              service:
                type: ClusterIP
              ingress:
                enabled: true
                className: traefik
                annotations:
                  traefik.ingress.kubernetes.io/router.tls.certResolver: le
                  traefik.ingress.kubernetes.io/router.entrypoints: websecure
                hosts:
                  - host: '{{values.url}}'
                    paths:
                      - path: /
                        pathType: ImplementationSpecific
                tls:
                 - hosts:
                   - '{{values.url}}'
```

## (optional) Setup SSO

Follow this tutorial to configure Authentik: https://goauthentik.io/integrations/services/argocd/ Follow it till point 3.

For the configuration of ArgoCD uncomment the values in values.yml from above. Adjust the values to your need.

Addply the changes with 

````bash
helm upgrade --install argocd argo/argo-cd -f values.yml -n argocd --create-namespace
```

Restart the Dex and Argocd Server pod to make the changes working.

Log into ArgoCD via SSO. You will see there are no application configs. This is because the permissions are missing. 

This can be changed by logging out, logging in again with the local admin and in Settings -> Projects -> default -> Roles add a new role with the following parameters:
* Role Name: sso-users
* Add policy:
  * Action: *
  * Application: default/*
  * Permission: allow
* Groups: ArgoCD Admins

When you now login as SSO user you see all application configurations.



## References
* Tutorial for K3s without HELM https://blog.differentpla.net/blog/2022/02/02/argocd/
* ArgoCD Getting Started guide https://argo-cd.readthedocs.io/en/stable/getting_started/#1-install-argo-cd
* Defualt values https://artifacthub.io/packages/helm/argo/argo-cd?modal=values&path=server.ingress
* SSO tutorial from ArgoCD https://argo-cd.readthedocs.io/en/stable/operator-manual/user-management/
