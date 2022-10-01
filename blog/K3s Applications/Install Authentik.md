# Install Authentik


```
helm repo add postgresql https://charts.bitnami.com/bitnami
helm repo add redis https://charts.bitnami.com/bitnami
helm repo add common https://library-charts.k8s-at-home.com/
helm repo add goauthentik https://charts.goauthentik.io/
helm repo update
```

Generate a postgres password and a secret key with
```openssl rand -base64 36```.

Create a file named **values.yaml** and adapt the values:


```
authentik:
    secret_key: "my-secret-key"
    postgresql:
        password: "my-postgres-password"

ingress:
  enabled: true
  annotations:
    kubernetes.io/ingress.class: "traefik"
  hosts:
    - host: auth.my-domain.com
      paths:
        - path: "/"
          pathType: Prefix
  tls:
    - secretName: internal-acme-crt-secret
      hosts:
        - 'auth.my-domain.com'

postgresql:
    enabled: true
    postgresqlPassword: "my-postgres-password"

redis:
    enabled: true
```

Install Authentik with this command
```
helm upgrade --install authentik authentik/authentik -f values.yaml -n authentik --create-namespace
```


```
kubectl rollout status -w --timeout=300s deployment/authentik-server -n authentik
kubectl rollout status -w --timeout=300s deployment/authentik-worker -n authentik
```

You can now setup Authentik over https://auth.my-domain.com/if/flow/initial-setup/

## References
* Tutorial is based on https://goauthentik.io/docs/installation/kubernetes
* Necessary repositories were found at https://artifacthub.io/packages/helm/goauthentik/authentik
* Ingress config is based on https://github.com/goauthentik/authentik/issues/741#issuecomment-822038893