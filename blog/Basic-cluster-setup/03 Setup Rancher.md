# Setup Rancher

Run the following commands on one of the master nodes installing Rancher and the certificate management system:

```
curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash
helm repo add rancher-stable https://releases.rancher.com/server-charts/stable
helm repo add jetstack https://charts.jetstack.io
cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
helm upgrade -i cert-manager jetstack/cert-manager -n cert-manager --create-namespace --set installCRDs=true 
```

Now Cert Manager gets installed. You can check the progress with
```kubectl get pods --namespace cert-manager```

Wait till it's finished!

The next step is to install Rancher. Adapt the domain name to your likening.
```
helm upgrade -i rancher rancher-stable/rancher -n cattle-system \
  --create-namespace \
  --set global.cattle.psp.enabled=false \
  --set hostname=rancher.example.com
```

The progress can be checked with
```
kubectl -n cattle-system rollout status deploy/rancher
```

## References
* Tutorial is based on TechnoTims Rancher HA tutorial [TechnoTim](https://docs.technotim.live/posts/rancher-ha-install/)!
* Rancher install psp issue https://github.com/rancher/rancher/issues/41295
