# Setup Loki with Grafana


```bash
helm repo add grafana https://grafana.github.io/helm-charts
```

```yaml
# helm upgrade -i loki-stack grafana/loki-stack -f values.yml -n loki-stack --create-namespace

grafana:
  enabled: true
  persistence:
    storageClassName: longhorn
  ingress:
    enabled: true
    annotations:
    hosts:
    - grafana.my-domain.com
    tls:
    - secretName: grafana-tls
      hosts:
      - grafana.my-domain.com

prometheus:
  enabled: true
  persistentVolume:
    storageClass: longhorn
  prometheus-node-exporter:
    enabled: false
  server:
    baseURL: https://prometheus.my-domain.com
  ingress:
    enabled: true
    annotations:
    hosts:
    - prometheus.my-domain.com
    tls:
    - secretName: prometheus-tls
      hosts:
      - prometheus.my-domain.com
  alertmanager:
    persistentVolume:
      enabled: false
  server:
    persistentVolume:
      enabled: false

loki:
  auth_enabled: false
  persistence:
    enabled: true
    storageClassName: longhorn
    size: 5Gi
  deploymentMode: SimpleScalable
  loki:
    schemaConfig:
      configs:
        - from: 2024-04-01
          store: tsdb
          object_store: s3
          schema: v13
          index:
            prefix: loki_index_
            period: 24h
    ingester:
      chunk_encoding: snappy
    tracing:
      enabled: true
    querier:
      # Default is 4, if you have enough memory and CPU you can increase, reduce if OOMing
      max_concurrent: 4
   
  ingester:
    replicas: 0
  querier:
    replicas: 0
    maxUnavailable: 2
  queryFrontend:
    replicas: 0
    maxUnavailable: 1
  queryScheduler:
    replicas: 0
  distributor:
    replicas: 0
    maxUnavailable: 2
  compactor:
    replicas: 0
  indexGateway:
    replicas: 0
    maxUnavailable: 1
  
  bloomCompactor:
    replicas: 0
  bloomGateway:
    replicas: 0
  
  # Enable minio for storage
  minio:
    enabled: true
  
  # Zero out replica counts of other deployment modes
  backend:
    replicas: 1
  read:
    replicas: 1
  write:
    replicas: 1
  
  singleBinary:
    replicas: 0 
  write:
    persistence:
      storageClass: longhorn
  read:
    persistence:
      storageClass: longhorn
  backend:
    persistence:
      storageClass: longhorn
  ingester:
    persistence:
      claims:
      - storageClass: longhorn
  querier:
    persistence:
      storageClass: longhorn
  indexGateway:
    persistence:
      storageClass: longhorn
  compactor:
    persistence:
      storageClass: longhorn
  compactor:
    persistence:
      claims:
      - storageClass: longhorn
  bloomGateway:
    persistence:
      storageClass: longhorn
  bloomGateway:
    persistence:
      claims:
      - storageClass: longhorn
  ruler:
    persistence:
      storageClass: longhorn
  resultsCache:
    persistence:
      storageClass: longhorn
  chunksCache:
    persistence:
      storageClass: longhorn
```

```bash
htpasswd -nb admin my-password | openssl base64
```

ingress.yml
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: traefik-basic-auth-secret
  namespace: loki-stack
data:
  users: |2
    my-hashed-password                  # <--change
---
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: traefik-basic-auth
  namespace: loki-stack
spec:
  basicAuth:
    secret: traefik-basic-auth-secret
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: loki-stack
  namespace: loki-stack
  annotations:
    kubernetes.io/ingress.class: traefik
    traefik.ingress.kubernetes.io/router.middlewares: loki-stack-traefik-basic-auth@kubernetescrd
spec:
  ingressClassName: traefik
  rules:
    - host: logging.my-domain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: loki-stack
                port:
                  number: 3100
  tls:
    - hosts:
        - logging.my-domain.com
      secretName: loki-gateway-tls
```



```bash
helm upgrade -i loki-stack grafana/loki-stack -f values.yml -n loki-stack --create-namespace
```

curl command for testing the final setup
```
curl -H "Content-Type: application/json" -XPOST -s "https://logging.my-domain.se/loki/api/v1/push"  --data-raw "{\"streams\": [{\"stream\": {\"job\": \"test\"}, \"values\": [[\"$(date +%s)000000000\", \"fizzbuzz\"]]}]}" -H X-Scope-OrgId:foo -u admin:my-password
```

## References
* https://grafana.com/docs/loki/latest/setup/install/helm/install-monolithic/
* Basic setup https://technotim.live/posts/grafana-loki-kubernetes/
* Loki helm values https://github.com/grafana/loki/blob/main/production/helm/loki/single-binary-values.yaml
* Grafana helm values https://github.com/grafana/helm-charts/blob/main/charts/grafana/values.yaml
* Tutorial showing how to set it up without authentification https://medium.com/@davis.angwenyi/how-to-install-grafana-loki-using-helm-3006e3d3581a
* Middleware config https://stackoverflow.com/questions/50130797/kubernetes-basic-authentication-with-traefik
* Simple middleware setup https://github.com/lexermal/website-weixler-me/blob/master/blog/Basic-cluster-setup/04%20Fix%20Traefik.md

