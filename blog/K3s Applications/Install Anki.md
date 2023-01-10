# Install Anki Sync Server

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: anki-pvc
  namespace: my-anki
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: longhorn
  resources:
    requests:
      storage: 5Gi    # <-- change
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: anki-deployment
  namespace: my-anki
  labels:
    app: anki-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: anki-pod
  template:
    metadata:
      labels:
        app: anki-pod
    spec:
      containers:
      - name: anki
        image: lexermal/anki-sync-server
        env:
         - name: PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION
           value: python
        volumeMounts:
        - name: anki-vol
          mountPath: /srv/ankisyncd
          subPath: data
        - name: anki-vol
          mountPath: /opt/ankisyncd/data
          subPath: db
      volumes:
      - name: anki-vol
        persistentVolumeClaim:
          claimName: anki-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: anki-service
  namespace: my-anki
spec:
  ports:
  - port: 27701
  selector:
    app: anki-pod
---
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: anki-route
  namespace: my-anki
spec:
  entryPoints:
    - websecure
  tls:
    certResolver: le
  routes:
    - match: Host(`anki.my-domain.com`)     # <-- change
      kind: Rule
      services:
        - name: anki-service
          port: 27701
```

```
kubectl create namespace my-anki
kubectl apply -f deployment.yml
```
