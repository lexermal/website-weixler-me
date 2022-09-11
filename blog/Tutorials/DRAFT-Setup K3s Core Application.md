# abc




## Setup Rancher with the following tutorial
https://docs.technotim.live/posts/rancher-ha-install/
https://www.youtube.com/watch?v=APsZJbnluXg

## Setup Longhorn

 sudo apt install bash curl grep gawk open-iscsi nfs-common -y
sudo systemctl enable open-iscsi --now

 Inspired by
 https://www.youtube.com/watch?v=eKBBHc0t7bc
https://docs.technotim.live/posts/longhorn-install/

Install Longhorn with the following commands:

kubectl apply -f https://raw.githubusercontent.com/longhorn/longhorn/master/deploy/longhorn.yaml

Watch how it installs
kubectl get pods --namespace longhorn-system --watch

Open longhorn over the UI interface of Rancher by choosing the cluster and then is on the left side "Longhorn". Open the webinterface.

The UI should look like this:
![Longhorn UI](/longhorn.png)

As you can see there are multiple nodes in this cluster. Some have not much space but large computing power. Theses hosts should not save any data columes of longhorn at their disk.

This can be disabled by navigating to *Node*, clicking on edit at that nodes and disabling the *scheduling*.


## Adding custom helm charts
Navigate to https://artifacthub.io/
Search for a package you like.
Click on

| Names        | URLs           |
| ------------- | ------------- |
| bitnami	| https://charts.bitnami.com          |
| gissilabs	| https://gissilabs.github.io/charts/ |
| gitlab	| http://charts.gitlab.io/ |
| k8s-at-home	| https://k8s-at-home.com/charts/ |
| minecraft-server-charts	| https://itzg.github.io/minecraft-server-charts/ |
| nextcloud	| https://nextcloud.github.io/helm/ |
| nicholaswilde	| https://nicholaswilde.github.io/helm-charts/ |
| Partners | https://git.rancher.io/partner-charts |
| prometheus | https://prometheus-community.github.io/helm-charts |
| Rancher | https://git.rancher.io/charts |
| RKE2	| https://git.rancher.io/rke2-charts |

## Make Traefik avaiable from outside
By default Traefik is exposed but only to the IP used at setting up the cluster. When the cluster communicates with its nodes over WireGuard, the exposed IP is the one set from WireGuard and that one is a private one(like 10.1.1.1).

To fix this create the following config file and change the public ip, the dns provider and the api token to your needs.
```yaml
apiVersion: helm.cattle.io/v1
kind: HelmChartConfig
metadata:
  name: traefik
  namespace: kube-system
spec:
  valuesContent: |-
    service:
      externalIPs:
        - 1.1.1.1  # <- change to your public ip

    # enable https forwarding
    ports:
      websecure:
        tls:
          enabled: true
      web:
        redirectTo: websecure

    # enable tls challenges for whole subdomains
    additionalArguments:
      - "--log.level=DEBUG"
      - "--certificatesresolvers.le.acme.email=contact@my-domain.com"  # <- your contact email adress
      - "--certificatesresolvers.le.acme.storage=/data/acme.json"
      - "--certificatesresolvers.le.acme.tlschallenge=true"
      - "--certificatesresolvers.le.acme.dnschallenge.provider=hosttech" # <- change to your dns provider
      - "--certificatesresolvers.le.acme.dnschallenge.delaybeforecheck=0"
    env:
      - name: HOSTTECH_API_KEY   # <- change to your dns provider
        value: my-api-token      # <- change to your access token
```

Apply the config with ```kubectl apply -f .```.

The way on how to redirect everything to https is based on this answer https://stackoverflow.com/a/71989847/808723


## Make Traefik accessible publically

To make Traefik accessible in a save way we are using basic auth.

First generate a secret called
```htpasswd -nb my-admin-user my-password | openssl base64```

Insert the password hash in the following config and adapt the domain name on which traefik will be available.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: traefik-basic-auth-secret
  namespace: kube-system
data:
  users: |2
    my-password-hash           # <- insert here your password hash
---
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: traefik-basic-auth
  namespace: kube-system
spec:
  basicAuth:
    secret: traefik-basic-auth-secret
---
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: dashboard
  namespace: kube-system
spec:
  entryPoints:
    - websecure
  tls:
    certResolver: le
  routes:
    - match: Host(`traefik.my-domain.com`)   # <- change to your domain
      kind: Rule
      middlewares:
        - name: traefik-basic-auth
          namespace: kube-system
      services:
        - name: api@internal
          kind: TraefikService
```

Apply the config with ```kubectl apply -f .```.

## Kubectl cheat sheet
https://kubernetes.io/docs/reference/kubectl/cheatsheet/

## Kubernetes best practices
https://kubernetes.io/docs/concepts/configuration/overview/

