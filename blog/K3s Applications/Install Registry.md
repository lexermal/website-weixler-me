# Install official docker registry

```helm repo add twuni https://helm.twun.io```

Generate the htpasswd with ```docker run --entrypoint htpasswd httpd:2 -Bbn my-user my-password```.


```
persistence:
  enabled: true
secrets:
  haSharedSecret: "my-password"
  htpasswd: "my-htpasswd string"
```
  
```
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: registry-ingress
  namespace: my-registry
spec:
  entryPoints:
    - websecure
  tls:
    certResolver: le
  routes:
    - match: Host(`registry.my-domain.com`) # <-- domain name for Dynmap
      kind: Rule
      services:
        - name: registry-docker-registry
          port: 5000
```
  
```helm upgrade --install registry twuni/docker-registry -f values.yml -n my-registry --create-namespace```

## Configure the usage of that repository deployment in the same cluster
If you want to use a private docker repository execute the following commands on every node that runs pods:
```
mkdir /etc/rancher/k3s
nano /etc/rancher/k3s/repositories.yaml
```

Insert the following config for your private repository:
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
