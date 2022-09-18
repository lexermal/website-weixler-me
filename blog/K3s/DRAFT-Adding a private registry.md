# Adding a private registry to K3s



## Configure the registry on a node
```sudo nano /etc/rancher/k3s/registries.yaml```

Write the following in that file:

```yml
mirrors:
  registry.my-domain.com:
    endpoint:
      - "https://registry.my-domain.com"
configs:
  "registry.my-domain.com":
    auth:
      username: registry_user
      password: my_registry_password
```


References:
This tutorial is based on https://rancher.com/docs/k3s/latest/en/installation/private-registry/