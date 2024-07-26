# Setup Rancher

## Setup Cert-Manager for Cert handling
Run the following commands to install Cert-Manager:

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


## Setup Rancher

Adapt the domain name to your liking.
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

## (optional) Configure automatic certificate generation with DNS challenges

For that, we need to configure Cert-Manager. I'm doing that using an example of the DNS provider Hetzner. Other providers like Cloudflare are similar and even easier to configure. [Here](https://levelup.gitconnected.com/easy-steps-to-install-k3s-with-ssl-certificate-by-traefik-cert-manager-and-lets-encrypt-d74947fe7a8) is an easy tutorial for HTTP challenges.

```yaml
helm repo add cert-manager-webhook-hetzner https://vadimkim.github.io/cert-manager-webhook-hetzner
# Replace the groupName value with your domain.
helm install -n cert-manager cert-manager-webhook-hetzner cert-manager-webhook-hetzner/cert-manager-webhook-hetzner --set groupName=acme.my-domain.com
```

api-secret.yml

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: hetzner-secret
  namespace: cert-manager
type: Opaque
stringData:
  api-key: your-api-key  # <-- change
```

issuer.yml
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-production
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: dns@my-domain.com      # <-- change

    # Name of a secret used to store the ACME account private key
    privateKeySecretRef:
      name: letsencrypt-production

    solvers:
      - dns01:
          webhook:
            groupName: acme.my-domain.com   # <-- change
            solverName: hetzner
            config:
              secretName: hetzner-secret
              apiUrl: https://dns.hetzner.com/api/v1
```

Reinstall Rancher with the following command to get a valid certificate.

_Don't forget to adapt the URL!_

```
helm uninstall rancher -n cattle-system

helm upgrade -i rancher rancher-stable/rancher -n cattle-system \
  --set global.cattle.psp.enabled=false \
  --set hostname=rancher.my-domain.com \
  --set ingress.tls.source=secret \
  --set ingress.extraAnnotations.'cert-manager\.io/cluster-issuer'=letsencrypt-production
```

It takes around 2 min for the certificate to be ready.

## (optional) Testing cert generation

We will deploy an nginx webserver to check if the certificates get generated.

nginx-values.yml
```yaml
ingress:
  enabled: true
  hostname: test.my-domain.com   # <-- change
  ingressClassName: traefik
  tls: true
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-production
service:
  type: ClusterIP
```

```bash
helm install my-release oci://registry-1.docker.io/bitnamicharts/nginx -f nginx-values.yml -n nginx-test --create-namespace
```

Even if the application deployment is finished after some seconds, you will still not be able to connect to it. It will show a "Connect reset by peer" error. This is because the SSL certificate needs to be created. You can check it with

```bash
kubectl get certificates -n nginx-test
```
If the flag READY is TRUE, you can access the Nginx via https://test.my-domain.com

**For further deployments, always ensure the ingress has the annotation set and lets the application be accessed over HTTPS!**

## References
* Tutorial is based on TechnoTims Rancher HA tutorial [TechnoTim](https://docs.technotim.live/posts/rancher-ha-install/)!
* Rancher install psp issue https://github.com/rancher/rancher/issues/41295
* Instruction for the Hetzner cert-manager connector [https://github.com/piccobit/cert-manager-webhook-hosttech/tree/main](https://github.com/vadimkim/cert-manager-webhook-hetzner)
* Nginx values.yml https://artifacthub.io/packages/helm/bitnami/nginx?modal=values&path=ingress.enabled
* DNS challenge for rancher https://github.com/rancher/rancher/issues/26850
