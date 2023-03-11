
## Secure K3s Cluster with Crowdsec
We assume that Longhorn is installed on that cluster.

```
helm repo add crowdsec https://crowdsecurity.github.io/helm-charts

nano values.yml
```
Insert the following content:

```yaml
container_runtime: containerd
lapi:
  dashboard:
    enabled: true
  resources:
    limits:
      memory: 200Mi
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

helm upgrade crowdsec crowdsec/crowdsec --install -n crowdsec -f values.yml --create-namespace
```

The rollout takes up to 30min and the api pod shows multiple errors in that time.

You can check the status with these commands:
```
kubectl rollout status -w --timeout=300s deployment/crowdsec-lapi -n crowdsec
kubectl rollout status -w --timeout=300s daemonset/crowdsec-agent -n crowdsec
```


Enroll the api key from https://app.crowdsec.net/overview

```
kubectl -n crowdsec exec deployment/crowdsec-lapi -- cscli console enroll my-enroll-key --name my-display-name
```

Go to https://app.crowdsec.net/overview and approve the cluster.

Restart the pod with ```kubectl rollout restart -n crowdsec deployment/crowdsec-lapi```

Now crowdsec is connected with the host. The next thing is to add the traefik bouncer to detect and block traffic.

Get the bouncer connection key with:
```
kubectl exec -it deployment/crowdsec-lapi -n crowdsec -c crowdsec-lapi -- cscli bouncers add traefik-bouncer
```


Create a file named **bouncer-values.yml** and insert the following:
```yaml
bouncer:
  crowdsec_bouncer_api_key: my-bouncer-key
  crowdsec_agent_host: "crowdsec-service.crowdsec.svc.cluster.local:8080"
  crowdsec_bouncer_ban_response_code: 400
```

Add the bouncer with

```bash
helm upgrade traefik-bouncer crowdsec/crowdsec-traefik-bouncer --install -n kube-system -f bouncer-values.yml
```

Now we need to make the dashboard of Crowdsec accessible by doing the following:

Create a file named **ingress.yml** with the following content:

```yaml
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: crowdsec-route
  namespace: crowdsec
spec:
  entryPoints:
    - websecure
  tls:
    certResolver: le
  routes:
    - match: Host(`crowdsec.my-domain.com`)   # <--change domain
      kind: Rule
      services:
        - name: crowdsec-service
          port: 3000
```

Apply the config with ```kubectl apply -f ingress.yml```


The bouncer is now running. To add Traefik bouncer as middleware globally, you need to add this configuration below to your Traefik helm values and upgrade.

```yaml
additionalArguments:
  - "--entrypoints.web.http.middlewares=kube-system-traefik-bouncer@kubernetescrd"
  - "--entrypoints.websecure.http.middlewares=kube-system-traefik-bouncer@kubernetescrd"
```



Congratulations your Crowdsec instance is working now!
You can now log in via https://crowdsec.my-domain.com

Username: **crowdsec@crowdsec.net**

Password: **!!Cr0wdS3c_M3t4b4s3??**

Don't forget to change the credentials.

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

## Test blocking
To test if blocking works connect a host with another public IP, like using your Hotspot on your phone.

Open the browser and open your domain like https://my-domain.com. You will see your expected side.

Then execute the following command to check for security vulnerabilities which triggers Crowdsec to block the IP temporally:
```
wapiti -u https://my-domain.com
```

When you reload now the page, you will see a "Forbidden" message. Only this IP is temporarily blocked.

## References
* This tutorial is based on this install script https://pastebin.com/2mq6dfmT
* Artefacthub helm infos https://artifacthub.io/packages/helm/crowdsec/crowdsec?modal=values
* Traefik Bouncer environment variables https://github.com/fbonalair/traefik-crowdsec-bouncer
* Traefik bouncer helm infos https://artifacthub.io/packages/helm/crowdsec/crowdsec-traefik-bouncer?modal=values
