# Install Authentik


```
helm repo add postgresql https://charts.bitnami.com/bitnami
helm repo add redis https://charts.bitnami.com/bitnami
helm repo add common https://library-charts.k8s-at-home.com/
helm repo add authentik https://charts.goauthentik.io/
helm repo update
```

Generate a postgres password and a secret key with
```openssl rand -base64 36```.

Create a file named **values.yaml** and adapt the values:


```
authentik:
    log_level: debug
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
helm upgrade --install authentik authentik/authentik -f values.yml -n authentik --create-namespace
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

## Authentik URLs

| Endpoint             | URL                                                                  |
| -------------------- | -------------------------------------------------------------------- |
| Authorization        | `/application/o/authorize/`                                          |
| Token                | `/application/o/token/`                                              |
| User Info            | `/application/o/userinfo/`                                           |
| Token Revoke         | `/application/o/revoke/`                                             |
| End Session          | `/application/o/<application slug>/end-session/`                     |
| JWKS                 | `/application/o/<application slug>/jwks/`                            |
| OpenID Configuration | `/application/o/<application slug>/.well-known/openid-configuration` |

## Using LDAP
Create an LDAP outpost with the name "LDAP outpost".
Other applications can connect to it via **ak-outpost-ldap-outpost.authentik.svc.cluster.local**. 

### Debug LDAP
If you want to debug the LDAP connection you can expose the LDAP outpost. But keep in mind it should be disabled as soon as you are finished debugging because leaving it exposed is a security risk.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: sumdays-authentik-service
  namespace: sumdays-authentik
spec:
  type: LoadBalancer
  ports:
  - port: 389
    protocol: TCP
    targetPort: 3389
    name: ldap
  - port: 636
    protocol: TCP
    targetPort: 6636
    name: ldaps
  selector:
     app.kubernetes.io/name: authentik-outpost-ldap
```

## References
* Tutorial is based on https://goauthentik.io/docs/installation/kubernetes
* Necessary repositories were found at https://artifacthub.io/packages/helm/goauthentik/authentik
* Ingress config is based on https://github.com/goauthentik/authentik/issues/741#issuecomment-822038893
* Source for Authentik urls https://goauthentik.io/docs/providers/oauth2/
* Service access within cluster https://stackoverflow.com/questions/37221483/service-located-in-another-namespace