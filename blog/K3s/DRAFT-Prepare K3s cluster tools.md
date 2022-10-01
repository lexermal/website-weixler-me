# Setup K3s


## Setup Rancher

Run the following commands on one of the master nodes:

```
curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash
helm repo add rancher-stable https://releases.rancher.com/server-charts/stable
kubectl create namespace cattle-system

```
Now everything is prepared for installing rancher and the certificate system.

Check which version of [cert-manager](https://github.com/cert-manager/cert-manager/releases) is the current one, adapt the following commands and run them:

```
kubectl apply --validate=false -f https://github.com/jetstack/cert-manager/releases/download/v1.7.1/cert-manager.crds.yaml
kubectl create namespace cert-manager
 helm repo add jetstack https://charts.jetstack.io
 helm repo update
cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
 helm install \
  cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --version v1.7.1
```
Now Cert Manager gets installed. You can check the progess with
```kubectl get pods --namespace cert-manager```

Wait till it is finished!

The next step is to install Rancher. Adapt the domain name to your likening.
```
helm install rancher rancher-stable/rancher \
  --namespace cattle-system \
  --set hostname=rancher.example.com
```

The progress can be checked with
```
kubectl -n cattle-system rollout status deploy/rancher
```

All credit goes to [TechnoTim](https://docs.technotim.live/posts/rancher-ha-install/)!


## Setup Longhorn
Execute the following commands on all nodes.
```
sudo apt install bash curl grep gawk open-iscsi nfs-common -y
sudo systemctl enable open-iscsi --now
```

 Inspired by
 https://www.youtube.com/watch?v=eKBBHc0t7bc
https://docs.technotim.live/posts/longhorn-install/

Install Longhorn with the following commands:

```
kubectl apply -f https://raw.githubusercontent.com/longhorn/longhorn/master/deploy/longhorn.yaml
```

Watch how it installs
```
kubectl get pods --namespace longhorn-system --watch
```

Open longhorn over the UI interface of Rancher by choosing the cluster and then is on the left side "Longhorn". Open the webinterface.

There are multiple nodes in this cluster. Some have not much space but large computing power. These hosts should not save any data colums of longhorn at their disk.

This can be disabled by navigating to *Node*, clicking on edit at that nodes and disabling the *scheduling*.

**Now make Longhorn the default storage class by clicking on "reset default" in the Rancher UI at the entry "local-path".**


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
      spec:
        # this forwards the real source ip to internal services
        externalTrafficPolicy: Local
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
