# Install Taiga with SSO
Recleimer: The same tutorial can be found for docker compose [here](https://github.com/lexermal/website-weixler-me/blob/master/blog/Docker/Install%20Taiga%20with%20OAuth.md).
cl
## Configure Authentik
Create a OAuth2/OpenID Provider with the following settings:
* Name: Taiga
* Authorization flow: Inplicit
* Client ID: copy it for later
* Client Secret: copy it for later
* Redirect URIs: https://taiga.my-domain.com/api/auth/oauth/oidc/callback

Create an Application with the following settings:
* Name: Taiga
* Slug: taiga
* Provider: Taiga

## Deploy Taiga

Create a namespace with ```kubectl create namespace my-taiga```.

Create the following files and adapt their values to your need:

**taiga-config.yml**
```
kind: ConfigMap
apiVersion: v1
metadata:
  namespace: my-taiga
  name: taiga-configmap
data:
  # Database settings
  POSTGRES_DB: "taiga"
  POSTGRES_USER: "taiga"
  POSTGRES_PASSWORD: "my-database-password"      # <-- change
  POSTGRES_HOST: "localhost"
  # Taiga settings
  TAIGA_SECRET_KEY: "my-secure-backend-key"     # <-- change
  TAIGA_SITES_DOMAIN: "taiga.my-domain.com"     # <-- change
  TAIGA_SITES_SCHEME: "http"
  # Email settings. Uncomment following lines and configure your SMTP server
  # EMAIL_BACKEND: "django.core.mail.backends.smtp.EmailBackend"
  # DEFAULT_FROM_EMAIL: "no-reply@example.com"
  # EMAIL_USE_TLS: "False"
  # EMAIL_USE_SSL: "False"
  # EMAIL_HOST: "smtp.host.example.com"
  # EMAIL_PORT: 587
  # EMAIL_HOST_USER: "user"
  # EMAIL_HOST_PASSWORD: "password"
  # Rabbitmq settings
  # Should be the same as in taiga-async-rabbitmq and taiga-events-rabbitmq
  RABBITMQ_USER: "taiga"
  RABBITMQ_PASS: "my-rabbitmq-password"     # <-- change
  # RabbitMQ Fixes
  CELERY_BROKER_URL: "amqp://taiga:my-rabbitmq-password@localhost:5672/taiga"     # <-- change
  EVENTS_PUSH_BACKEND: "taiga.events.backends.rabbitmq.EventsPushBackend"
  EVENTS_PUSH_BACKEND_URL: "amqp://taiga:my-rabbitmq-password@taiga-event-service:5672/taiga"     # <-- change
  # Telemetry settings
  ENABLE_TELEMETRY: "True"
  # Enable OpenID to allow to register users if they do not exist. Set to false to disable all signups
  PUBLIC_REGISTER_ENABLED: "True"
  # OpenID settings
  ENABLE_OPENID: "True"
  OPENID_USER_URL: "https://auth.my-domain.com/application/o/userinfo/"     # <-- change
  OPENID_TOKEN_URL: "https://auth.my-domain.com/application/o/token/"     # <-- change
  OPENID_CLIENT_ID: "my-oauth-client-id"     # <-- change
  OPENID_CLIENT_SECRET: "my-oauth-client-secret"     # <-- change
  OPENID_SCOPE: "openid profile email"
  ```

**deployment.yml**:
```
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: taiga-pvc
  namespace: my-taiga
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: longhorn
  resources:
    requests:
      storage: 10Gi    # <-- change
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: taiga-deployment
  namespace: my-taiga
  labels:
    app: taiga-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: taiga-pod
  template:
    metadata:
      labels:
        app: taiga-pod
    spec:
      containers:
      - name: taiga-backend
        image: robrotheram/taiga-back-openid
        envFrom:
        - configMapRef:
            name: taiga-configmap
        volumeMounts:
        - name: taiga-vol
          mountPath: /taiga-back/static
          subPath: taiga-static
        - name: taiga-vol
          mountPath: /taiga-back/media
          subPath: taiga-media
      - name: taiga-async
        image: taigaio/taiga-back
        command: ["/taiga-back/docker/async_entrypoint.sh"]
        envFrom:
        - configMapRef:
            name: taiga-configmap
        volumeMounts:
        - name: taiga-vol
          mountPath: /taiga-back/static
          subPath: taiga-static
        - name: taiga-vol
          mountPath: /taiga-back/media
          subPath: taiga-media
      - name: taiga-postgresql
        image: postgres:12.3
        env:
        - name: POSTGRES_DB
          value: "taiga"
        - name: POSTGRES_USER
          value: "taiga"
        - name: POSTGRES_PASSWORD
          value: "my-database-password"     # <-- change
        volumeMounts:
        - name: taiga-vol
          mountPath: /var/lib/postgresql/data
          subPath: postgres
      - name: taiga-async-rabbitmq
        image: rabbitmq:3-management-alpine
        env:
        - name: RABBITMQ_ERLANG_COOKIE
          value: "my-secret-erlang-cookie"     # <-- change
        - name: RABBITMQ_DEFAULT_USER
          value: "taiga"
        - name: RABBITMQ_DEFAULT_PASS
          value: "my-rabbitmq-password"     # <-- change
        - name: RABBITMQ_DEFAULT_VHOST
          value: "taiga"
        volumeMounts:
        - name: taiga-vol
          mountPath: /var/lib/rabbitmq
          subPath: async-rabbitmq-data
      - name: taiga-frontend
        image: robrotheram/taiga-front-openid
        env:
        - name: TAIGA_URL
          value: "https://taiga.my-domain.com"     # <-- change
        - name: TAIGA_WEBSOCKETS_URL
          value: "wss://taiga.my-domain.com"     # <-- change
        - name: ENABLE_OPENID
          value: "true"
        - name: OPENID_URL
          value: "https://auth.my-domain.com/application/o/authorize/"     # <-- change
        - name: OPENID_CLIENT_ID
          value: "my-oauth-client-id"      # <-- change
        - name: OPENID_NAME
          value: "Authentik"
        - name: OPENID_SCOPE
          value: "openid profile email"
      - name: taiga-protected
        image: taigaio/taiga-protected
        env:
        - name: MAX_AGE
          value: "360"
        - name: SECRET_KEY
          value: "my-secure-backend-key"     # <-- change
      - name: taiga-gateway
        image: nginx:1.19-alpine
        volumeMounts:
        - name: taiga-vol
          mountPath: /taiga/static
          subPath: taiga-static
        - name: taiga-vol
          mountPath: /taiga/media
          subPath: taiga-media
        - name: nginx-config
          mountPath: "/etc/nginx/conf.d/"
          readOnly: true
      volumes:
      - name: taiga-vol
        persistentVolumeClaim:
          claimName: taiga-pvc
      - name: nginx-config
        configMap:
          name: nginx-config
---
apiVersion: v1
kind: Service
metadata:
  name: taiga-service
  namespace: my-taiga
spec:
  ports:
  - port: 3000
  selector:
    app: taiga-pod
```

**event-deployment.yml**;
```
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: taiga-event-pvc
  namespace: my-taiga
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
  name: taiga-event-deployment
  namespace: my-taiga
  labels:
    app: taiga-event-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: taiga-event-pod
  template:
    metadata:
      labels:
        app: taiga-event-pod
    spec:
      containers:
      - name: taiga-events
        image: taigaio/taiga-events
        env:
        - name: RABBITMQ_USER
          value: "taiga"     # <-- change
        - name: RABBITMQ_PASS
          value: "my-rabbitmq-password"     # <-- change
        - name: TAIGA_SECRET_KEY
          value: "my-secure-backend-key"     # <-- change
      - name: taiga-events-rabbitmq
        image: rabbitmq:3-management-alpine
        env:
        - name: RABBITMQ_ERLANG_COOKIE
          value: "my-secret-erlang-cookie"     # <-- change
        - name: RABBITMQ_DEFAULT_USER
          value: "taiga"
        - name: RABBITMQ_DEFAULT_PASS
          value: "my-rabbitmq-password"     # <-- change
        - name: RABBITMQ_DEFAULT_VHOST
          value: "taiga"
        volumeMounts:
        - name: taiga-event-vol
          mountPath: /var/lib/rabbitmq
          subPath: taiga-events-rabbitmq-data
      volumes:
      - name: taiga-event-vol
        persistentVolumeClaim:
          claimName: taiga-event-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: taiga-event-service
  namespace: my-taiga
spec:
  ports:
  - port: 8888
    name: event-service
  - port: 5672
    name: mq
  selector:
    app: taiga-event-pod
---
apiVersion: v1
kind: Service
metadata:
  name: taiga-events-rabbitmq
  namespace: my-taiga
spec:
  ports:
  - port: 5672
  selector:
    app: taiga-event-pod
```


**nginx-config.yml**:
```
kind: ConfigMap
apiVersion: v1
metadata:
  namespace: my-taiga
  name: nginx-config
data:
  nginx.conf: |
    server {
      listen 3000 default_server;
      client_max_body_size 100M;
      charset utf-8;
      # Frontend
      location / {
          proxy_pass http://localhost/;
          proxy_pass_header Server;
          proxy_set_header Host $http_host;
          proxy_redirect off;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Scheme $scheme;
      }
      # API
      location /api/ {
          proxy_pass http://localhost:8000/api/;
          proxy_pass_header Server;
          proxy_set_header Host $http_host;
          proxy_redirect off;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Scheme $scheme;
      }
      # Admin
      location /admin/ {
          proxy_pass http://localhost:8000/admin/;
          proxy_pass_header Server;
          proxy_set_header Host $http_host;
          proxy_redirect off;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Scheme $scheme;
      }
      # Static
      location /static/ {
          alias /taiga/static/;
      }
      # Media
      location /_protected/ {
          internal;
          alias /taiga/media/;
          add_header Content-disposition "attachment";
      }
      # Unprotected section
      location /media/exports/ {
          alias /taiga/media/exports/;
          add_header Content-disposition "attachment";
      }
      location /media/ {
          proxy_set_header Host $http_host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Scheme $scheme;
          proxy_set_header X-Forwarded-Proto $scheme;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_pass http://localhost:8003/;
          proxy_redirect off;
      }
      # Events
      location /events {
          proxy_pass http://taiga-event-service:8888/events;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection "upgrade";
          proxy_connect_timeout 7d;
          proxy_send_timeout 7d;
          proxy_read_timeout 7d;
      }
    }
```

**service.yml**:
```
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: taiga-route
  namespace: my-taiga
spec:
  entryPoints:
    - websecure
  tls:
    certResolver: le
  routes:
    - match: Host(`taiga.my-domain.com`)     # <-- change
      kind: Rule
      services:
        - name: taiga-service
          port: 3000
```          

Deploy Taiga with ```kubectl apply -f .```.

This tutorial is a starting point for deploying Taiga, feel free to enhance it.

## References
* Nginx config file for routing https://github.com/kaleidos-ventures/taiga-docker/blob/main/taiga-gateway/taiga.conf
* Taiga Oauth Library https://github.com/robrotheram/taiga-contrib-openid-auth
