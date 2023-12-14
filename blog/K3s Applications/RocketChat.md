# Setup RocketChat

```bash
helm repo add rocketchat https://rocketchat.github.io/helm-charts
```

```yaml
host: chat.my-domain.com
mongodb:
  auth:
    passwords:
      - my-password
    rootPassword: my-password
mongodb:
  persistence:
    storageClass: longhorn
persistence:
  enabled: true
  storageClassName: longhorn
ingress:
  enabled: true
  ingressClassName: traefik
  tls:
    - hosts:
        - chat.my-domain.org
```

```bash
helm upgrade -i rocketchat rocketchat/rocketchat -f values.yml -n my-rocketchat --create-namespace
```


## (optional) Configure SSO

Configure it like defined here https://goauthentik.io/integrations/services/rocketchat/

Under Settings -> Account disable 2F-Authentification.

## References
* Values.yml file https://github.com/RocketChat/helm-charts/blob/master/rocketchat/values.yaml
* RocketChat Kubernetes deployment instructions https://docs.rocket.chat/deploy/deploy-rocket.chat/additional-deployment-methods/deploy-with-kubernetes
* Authentik SSO instructions https://goauthentik.io/integrations/services/rocketchat/
