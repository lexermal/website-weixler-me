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
        password: "my-db-password"
postgresql:
    enabled: true
    postgresqlPassword: "my-db-password"
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

kubectl get service --namespace authentik

```
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: authentik-route
  namespace: authentik
spec:
  entryPoints:
    - websecure
  tls:
    certResolver: le
  routes:
    - match: Host(`auth.my-domain.com`)   # <--change domain
      kind: Rule
      services:
        - name: authentik
          port: 80
```

kubectl apply -f ingress.yml


You can now setup Authentik over https://auth.my-domain.com/if/flow/initial-setup/

## References
* Tutorial is based on https://goauthentik.io/docs/installation/kubernetes
* Necessary repositories were found at https://artifacthub.io/packages/helm/goauthentik/authentik
* Ingress config is based on https://github.com/goauthentik/authentik/issues/741#issuecomment-822038893