# Setup Technitium DNS Server

```bash
helm repo add obeone https://charts.obeone.cloud
```


```yaml
image:
  pullPolicy: IfNotPresent
ingress:
  main:
    enabled: true
    ingressClassName: traefik
    hosts:
      - host: dns.my-domain.org
        paths:
          - path: /
            pathType: Prefix
persistence:
  config:
    enabled: true
    type: pvc
    storageClass: longhorn
    mountPath: /etc/dns
service:
  main:
    type: NodePort
    ports:
     #dns-udp:  # did not test if port change works
        #port: 4053
      dns-tcp:
        enabled: false
      dhcp:
        enabled: false
      dot:
        enabled: false
      doh-reverse:
        enabled: false
```

```bash
helm upgrade -i dns-server obeone/technitium-dnsserver -f values.yml -n my-dns --create-namespace
```

```yaml
apiVersion: v1
kind: Service
metadata:
  name: dns-server-service
  namespace: my-dns
spec:
  type: LoadBalancer
  ports:
  - port: 5053
    protocol: UDP
  selector:
    app.kubernetes.io/instance: dns-server
    app.kubernetes.io/name: technitium-dnsserver
```

```bash
kubectl apply -f service.yml
```

I changed the port in the web interface to also run the DNS server on port 5053.

Under Settings -> Recursion I allowed recursion.

Under Proxy & Forwarders it's good to set under "Forwarders" a public DNS server like 1.1.1.1 to resolve all DNS entries that your DNS server can not answer.

## References
* Deployment configuration https://artifacthub.io/packages/helm/obeone/technitium-dnsserver?modal=values



