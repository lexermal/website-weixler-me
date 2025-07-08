# Install Authentik


```
helm repo add authentik https://charts.goauthentik.io/
```

Generate a postgres password and a secret key with
```openssl rand -base64 36```.

Create a file named **values.yaml** and adapt the values:


```yaml
authentik:
  log_level: debug
  secret_key: my-secret-key       # change
  postgresql:
    password: my-db-password      # change
postgresql:
  enabled: true
  auth:
    password: my-db-password      # change
redis:
  enabled: true
server:
  ingress:
    enabled: true
    ingressClassName: traefik
    annotations:
      cert-manager.io/cluster-issuer: letsencrypt-production
    hosts:
      - auth.my-domain.com        # change
    tls:
      - secretName: authentik-tls
        hosts:
          - auth.my-domain.com    # change
```

Install Authentik with this command
```
helm upgrade --install authentik authentik/authentik -f values.yml -n authentik --create-namespace
```

The installation will take around 5 min. You can see the status via
```
kubectl rollout status -w --timeout=300s deployment/authentik-server -n authentik
```


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
* Source for Authentik urls https://goauthentik.io/docs/providers/oauth2/
* Service access within cluster https://stackoverflow.com/questions/37221483/service-located-in-another-namespace
