
## Secure K3s Cluster with Crowdsec
We assume that Longhorn is installed on that cluster.

```
helm repo add crowdsec https://crowdsecurity.github.io/helm-charts && helm repo update

nano custom-values.yaml
```
Insert the following content:

```yaml
container_runtime: containerd
lapi:
  dashboard:
    enabled: true
  resources: {}
  persistentVolume:
    data:
      storageClassName: longhorn
      accessModes:
        - ReadWriteMany
      size: 4Gi
    config:
      storageClassName: longhorn
      accessModes:
        - ReadWriteMany
      size: 4Gi
agent:
  acquisition:
    - namespace: kube-system
      podName: traefik-*
      program: traefik
  resources: {}
  persistentVolume:
    config:
      storageClassName: longhorn
      accessModes:
        - ReadWriteMany
      size: 1Gi
  env:
    - name: PARSERS
      value: "crowdsecurity/cri-logs"
    - name: COLLECTIONS
      value: "crowdsecurity/traefik"
    - name: DISABLE_PARSERS
      value: "crowdsecurity/whitelists"
```

Rise the inotify limit and install crowdsec.
```bash
echo "fs.inotify.max_user_instances=1280" | sudo tee -a /etc/sysctl.conf
echo "fs.inotify.max_user_watches=655360" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

helm upgrade crowdsec crowdsec/crowdsec --install -n crowdsec -f custom-values.yaml --create-namespace
```

The rollout takes up to 30min and the api pod shows multiple errors in that time.

You can check the status with these commands:
```
kubectl rollout status -w --timeout=300s deployment/crowdsec-lapi -n crowdsec
kubectl rollout status -w --timeout=300s daemonset/crowdsec-agent -n crowdsec
```

Get the pod name of crowdsec-lapi with ```kubectl get pods --namespace crowdsec```

Then enroll the api key from https://app.crowdsec.net/overview

```
kubectl --namespace crowdsec exec crowdsec-lapi-pod-name -- cscli console enroll my-enroll-key --name my-display-name
```

Go to https://app.crowdsec.net/overview and approve the cluster.

Restart the pod with ```kubectl rollout restart -n crowdsec deployment/crowdsec-lapi```

Now crowdsec is connected with the host. The next thing is to add the traefik bouncer to detect and block traffic.

Get the bouncer connection key with:
```
kubectl exec -it deployment/crowdsec-lapi -n crowdsec -c crowdsec-lapi -- cscli bouncers add traefik-bouncer
```


Create a file named **traefik_bouncer-values.yaml** and insert the following:
```
bouncer:
  crowdsec_bouncer_api_key: my-bouncer-key
  crowdsec_agent_host: "crowdsec-service.crowdsec.svc.cluster.local:8080"
```

Add the bouncer with

```
helm upgrade traefik-bouncer crowdsec/crowdsec-traefik-bouncer --install -n kube-system -f traefik_bouncer-values.yaml
```

Now we need to make the dashboard of crowsdec visible via a webinterface with doing the following:

Create a file named **crowdsec-dashboard-cert.yaml** with the following content:
```
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: crowdsec-dashboard-cert
  namespace: crowdsec
spec:
  commonName: crowdsec.my-domain.com
  secretName: crowdsec-dashboard-cert
  dnsNames:
    - crowdsec.my-domain.com
  issuerRef:
    name: "Contact Weixler"
    kind: ClusterIssuer
```

Now we add the ingress route

Create a file named **crowdsec-dashboard-ingress.yaml** and add the following content. Adapt the domain name

```
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: crowdsec-dashboard-ingress
  namespace: crowdsec
spec:
  entryPoints:
    - websecure
  routes:
  - match: Host(`crowdsec.my-domain.com`)
    kind: Rule
    services:
    - name: crowdsec-service
      port: 3000
  tls:
      secretName: crowdsec-dashboard-cert
```


Apply the configs with
```
kubectl apply -f crowdsec-dashboard-cert.yaml
kubectl apply -f crowdsec-dashboard-ingress.yaml
```


The bouncer is now running. To add Traefik bouncer as middleware globally, you need to add this configuration below to your Traefik helm values and upgrade.

```
additionalArguments:
  - "--entrypoints.web.http.middlewares=kube-system-traefik-bouncer@kubernetescrd"
  - "--entrypoints.websecure.http.middlewares=kube-system-traefik-bouncer@kubernetescrd"
```



Congratulations your Crowdsec instance is working now!
You can now log in via https://crowdsec.my-domain.com

username: crowdsec@crowdsec.net

password: !!Cr0wdS3c_M3t4b4s3??

## Verify blocking

Now to verify that blocking works, check logs of your crowdsec-lapi pod with the following (for your pod adapted) command:

```
 kubectl logs crowdsec-lapi-pod-name --namespace crowdsec
```
When logs could look like this:


```bash
time="30-09-2022 12:04:50" level=info msg="10.42.0.137 - [Fri, 30 Sep 2022 12:04:50 UTC] \"GET /v1/decisions?type=ban&ip=10.42.0.1 HTTP/1.1 200 122.06386ms \"Go-http-client/1.1\" \""
time="30-09-2022 12:05:26" level=info msg="10.42.0.137 - [Fri, 30 Sep 2022 12:05:26 UTC] \"GET /v1/decisions?type=ban&ip=10.42.0.1 HTTP/1.1 200 98.097303ms \"Go-http-client/1.1\" \""
time="30-09-2022 12:05:26" level=info msg="10.42.0.137 - [Fri, 30 Sep 2022 12:05:26 UTC] \"GET /v1/decisions?type=ban&ip=10.42.0.1 HTTP/1.1 200 68.349596ms \"Go-http-client/1.1\" \""
```
If you see here private IP addresses (10.x.x.x) then you need to update the config of Traefik with "externalTrafficPolicy: Local".

To do so create the following file:

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
        externalTrafficPolicy: Local

```

Apply the config with ```kubectl apply -f .```

Now you will see other IP addresses and your instance is secure.

## Test out blocking
To test if blocking works connect a host with another public IP, like using your Hotspot on your phone.

Open the browser and open your domain like https://my-comain.com. You will see your expected side.

Then execute the following command to check for security vulnerabilities which triggers Crowdsec to block the IP temporally:
```
wapiti -u https://my-comain.com
```

When you reload now the page, you will see a "Forbidden" message. Only this IP is temporarily blocked.

## Remarks

This tutorial is based on this install script
https://pastebin.com/2mq6dfmT