# Install Casdoor

This installation is basic. It is recommended to connect it with a database.

Create a values.yml file with the following content:
```yaml

database:
  user: root
  password: my-password   <-- change

ingress:
  enabled: true
  className: traefik
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-production
  hosts:
    - host: auth.my-domain.com   <-- change
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: auth-tls
    - hosts:
      - auth.my-domain.com   <-- change
```

Install and upgrade Casdoor with
```bash
helm upgrade -i auth oci://registry-1.docker.io/casbin/casdoor-helm-charts -f values.yml -n auth --create-namespace
```

Now you can login on https://auth.my-domain.com with the user **admin** and the password **123**.

## References
- Default values: https://github.com/casdoor/casdoor-helm/blob/master/charts/casdoor/values.yaml
- Access credentials: https://casdoor.org/docs/basic/server-installation/#production-mode
