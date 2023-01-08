# Install official docker registry

## Install the registry
```helm repo add twuni https://helm.twun.io```

Generate the htpasswd with ```docker run --entrypoint htpasswd httpd:2 -Bbn my-user my-password```.

Create the file values.yml and insert the following contend:
```
persistence:
  enabled: true
secrets:
  haSharedSecret: "my-password"
  htpasswd: "my-htpasswd string"
ingress:
  enabled: true
  className: traefik
  hosts:
    - registry.my-domain.com
  annotations:
      traefik.ingress.kubernetes.io/router.entrypoints: websecure
      traefik.ingress.kubernetes.io/router.tls.certResolver: le  
```
  
```helm upgrade --install registry twuni/docker-registry -f values.yml -n my-registry --create-namespace```

## (optional) Install Registry UI

```helm repo add joxit https://helm.joxit.dev```

Create the file ui-values.yml and insert the following contend:
```
ui:
  deleteImages: true
  proxy: true
  dockerRegistryUrl: "http://registry-docker-registry.my-registry.svc.cluster.local:5000"
  ingress:
    enabled: true
    host: ui.registry.my-domain.com
    ingressClassName: traefik
    annotations:
      traefik.ingress.kubernetes.io/router.entrypoints: websecure
      traefik.ingress.kubernetes.io/router.tls.certResolver: le
```

```helm upgrade --install registry-ui joxit/docker-registry-ui -f ui-values.yml -n my-registry-ui --create-namespace```


## (optional) Configure the usage of that repository deployment in the same cluster
If you want to use a private docker repository execute the following commands on every node that runs pods:
```
mkdir /etc/rancher/k3s
nano /etc/rancher/k3s/registries.yaml
```

Insert the following config for your private registry:
```
mirrors:
  registry.my-domain.com:    # <-- change to your domain
    endpoint:
      - "http://registry-docker-registry.my-registry-namespace.svc.cluster.local"    # <-- change to your namespace
configs:
  "registry.my-domain.com":    # <-- change to your domain
    auth:
      username: my-user       # <-- change
      password: my-password   # <-- change
```

## References
* Source for K3s private repository configuration https://docs.k3s.io/installation/private-registry
* Registry UI infos https://artifacthub.io/packages/helm/joxit/docker-registry-ui?modal=values
* Docker Registry Helm variables https://artifacthub.io/packages/helm/twuni/docker-registry
