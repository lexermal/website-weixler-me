# Setup Rancher

Run the following commands on one of the master nodes:

```
curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash
helm repo add rancher-stable https://releases.rancher.com/server-charts/stable
```
Now everything is prepared for installing rancher and the certificate system.

Check which version of [cert-manager](https://github.com/cert-manager/cert-manager/releases) is the current one, adapt the following commands and run them:

```
kubectl apply --validate=false -f https://github.com/jetstack/cert-manager/releases/download/v1.7.1/cert-manager.crds.yaml
helm repo add jetstack https://charts.jetstack.io
helm repo update
cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
helm upgrade --install cert-manager jetstack/cert-manager --namespace cert-manager --create-namespace
```

Now Cert Manager gets installed. You can check the progess with
```kubectl get pods --namespace cert-manager```

Wait till it is finished!

The next step is to install Rancher. Adapt the domain name to your likening.
```
helm upgrade --install rancher rancher-stable/rancher \
  --namespace cattle-system \
  --create-namespace \
  --set hostname=rancher.example.com
```

The progress can be checked with
```
kubectl -n cattle-system rollout status deploy/rancher
```

All credit goes to [TechnoTim](https://docs.technotim.live/posts/rancher-ha-install/)!
