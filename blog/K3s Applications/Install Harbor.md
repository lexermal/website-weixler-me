# Install Harbor


helm repo add harbor https://helm.goharbor.io


```
expose:
  ingress:
    hosts:
      core: registry.my-domain.com
      notary: notary.my-domain.com
externalURL: https://registry.my-domain.com
harborAdminPassword: my-password
secretKey: my-password
registry:
  credentials:
    username: reg_admin
    password: my-password
database:
  internal:
    password: my-password
database:
  external:
    username: db_user
    password: my-password
```    


helm upgrade --install harbor harbor/harbor -f values.yml -n harbor --create-namespace
