# Install Scrumlr behind Authentik proxy

Create a deployment.yml file with the following contend and adapt the values to your needs:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: scrumlr-pvc
  namespace: my-scrumlr
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: longhorn
  resources:
    requests:
      storage: 2Gi    # <-- change
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: scrumlr-deployment
  namespace: my-scrumlr
  labels:
    app: scrumlr-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: scrumlr-pod
  template:
    metadata:
      labels:
        app: scrumlr-pod
    spec:
      containers:
      - name: nats
        image: nats:2-alpine
      - name: postgres
        image: postgres:14.1
        env:
        - name: POSTGRES_USER
          value: admin
        - name: POSTGRES_PASSWORD
          value: "my-db-password"     # <-- change
        - name: POSTGRES_DB
          value: scrumlr
        - name: POSTGRES_INITDB_ARGS
          value: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
        volumeMounts:
        - name: scrumlr-vol
          mountPath: /var/lib/postgresql/data
          subPath: db-data
      - name: scrumlr
        image: ghcr.io/inovex/scrumlr.io/scrumlr-server:sha-be0781f
        env:
        - name: SCRUMLR_SERVER_PORT
          value: "7000"
        - name: SCRUMLR_SERVER_DATABASE_URL
          value: "postgres://admin:my-db-password@localhost:5432/scrumlr?sslmode=disable"    # <-- change
        - name: SCRUMLR_SERVER_NATS_URL
          value: "nats://localhost:4222"
        - name: SCRUMLR_API_HOST
          value: "localhost"
        - name: SCRUMLR_BASE_URL
          value: "https://retro.my-domain.com/api"  # <-- change
      - name: frontend
        image: ghcr.io/inovex/scrumlr.io/scrumlr-frontend:sha-be0781f
        env:
        - name: SCRUMLR_SERVER_URL
          value: "https://retro.my-domain.com/api"  # <-- change
        - name: SCRUMLR_WEBSOCKET_URL
          value: "wss://retro.my-domain.com/api"  # <-- change
        - name: PUBLIC_URL
          value: "https://retro.my-domain.com"  # <-- change
      volumes:
      - name: scrumlr-vol
        persistentVolumeClaim:
          claimName: scrumlr-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: scrumlr-service
  namespace: my-scrumlr
spec:
  ports:
  - port: 80
    name: frontend
  - port: 7000
    name: backend
  selector:
    app: scrumlr-pod
---
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: middleware-authentik
  namespace: my-scrumlr   # <-- change
spec:
  forwardAuth:
    address: https://retro.my-domain.com/outpost.goauthentik.io/auth/traefik  #<--change domain
    trustForwardHeader: true
    authResponseHeaders:
      - X-authentik-username
      - X-authentik-groups
      - X-authentik-email
      - X-authentik-name
      - X-authentik-uid
      - X-authentik-jwt
      - X-authentik-meta-jwks
      - X-authentik-meta-outpost
      - X-authentik-meta-provider
      - X-authentik-meta-app
      - X-authentik-meta-version
---
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: scrumlr-frontend-route
  namespace: my-scrumlr
spec:
  entryPoints:
    - websecure
  tls:
    certResolver: le
  routes:
    - match: Host(`retro.my-domain.com`)   # <-- change
      kind: Rule
      middlewares:
        - name: middleware-authentik
      services:
        - name: scrumlr-service
          port: 80
---
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: strip-api
  namespace: my-scrumlr
spec:
  stripPrefix:
    prefixes:
      - /api
---
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: scrumlr-backend-route
  namespace: my-scrumlr
spec:
  entryPoints:
    - websecure
  tls:
    certResolver: le
  routes:
    - match: Host(`retro.my-domain.com`) && PathPrefix(`/api`)     # <-- change
      kind: Rule
      middlewares:
        - name: strip-api
      services:
        - name: scrumlr-service
          port: 7000
```

Deploy the application with ```kubectl apply -f deployment.yml```



## Configure Authentik

Make a Provider with the following settings:
* Provider: Proxy Provider
* Name: Scrumlr
* Autheorization flow: implicit
* Forward type: Forward auth (single application)
* External host: https://retro.my-domain.com

Create an application with the following settings:
* Name: Scrumlr
* Provider: scrumlr
* Launch URL: https://retro.my-domain.com

Create an Outpost:
* Name: scrumlr-outpost
* Type: Proxy
* Application: Scrumlr

Now your application is secureelly available at https://retro.my-domain.com
