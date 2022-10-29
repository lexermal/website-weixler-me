# Install Penpot

Hello today I will show you how to setup Penpot in a Kubernetes Cluster with Longhorn as storage solution.

Because Penpot does not have an official Helm chart I needed to create this Kubernetes deployment based on the official docker images and docker compose file.

The setup will work with OIDC auth.

## Configure Authentik
Create a OAuth2/OpenID Provider with the following settings:
* Name: Penpot
* Authorization flow: Inplicit
* Client ID: copy it for later
* Client Secret: copy it for later
* Redirect URIs: https://penpot.my-domain.com/api/auth/oauth/oidc/callback

Create an Application with the following settings:
* Name: Penpot
* Slug: penpot
* Provider: Penpot


## Deploy Penpot
Because we want to use Penpot only via OIDC auth, we still need to enable the registration in Penpot to let the tool create the required user space. But to not let everyone use the tool just by using the normal registration only my-domain.com is whitelisted and an email validation needs to be done, but no email settings are configured. This prevents basically everyone that is not accessing the tool via OIDC from using it. I hope the Penpot team will make this feature more convenient.

Now lets setup Penpot. Create the following file named "deployment.yml":

```yaml
kind: ConfigMap
apiVersion: v1
metadata:
  namespace: penpot
  name: penpot-configmap
data:
  PENPOT_PUBLIC_URI: https://penpot.my-domain.com    # <-- change
  PENPOT_FLAGS: enable-registration disable-login enable-email-verification enable-login-with-oidc
  PENPOT_HTTP_SERVER_HOST: 0.0.0.0
  PENPOT_DATABASE_URI: postgresql://localhost/penpot
  PENPOT_DATABASE_USERNAME: penpot
  PENPOT_DATABASE_PASSWORD: my-database-password    # <-- change
  PENPOT_REDIS_URI: redis://localhost/0
  PENPOT_ASSETS_STORAGE_BACKEND: assets-fs
  PENPOT_STORAGE_ASSETS_FS_DIRECTORY: /opt/data/assets
  PENPOT_TELEMETRY_ENABLED: "true"
  PENPOT_OIDC_BASE_URI: https://auth.my-domain.com/application/o/     # <-- change
  PENPOT_OIDC_CLIENT_ID: my-client-id     # <-- change
  PENPOT_OIDC_CLIENT_SECRET: my-client-secret     # <-- change
  PENPOT_OIDC_AUTH_URI: https://auth.my-domain.com/application/o/authorize/    # <-- change
  PENPOT_OIDC_TOKEN_URI: https://auth.my-domain.com/application/o/token/    # <-- change
  PENPOT_OIDC_USER_URI: https://auth.my-domain.com/application/o/userinfo/    # <-- change
  PENPOT_REGISTRATION_DOMAIN_WHITELIST: "my-domain.com"   # <-- change
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: penpot-pvc
  namespace: penpot
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
  name: penpot-deployment
  namespace: penpot
  labels:
    app: penpot-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: penpot-pod
  template:
    metadata:
      labels:
        app: penpot-pod
    spec:
      containers:
      - name: penpot-frontend
        image: penpotapp/frontend
        envFrom:
        - configMapRef:
            name: penpot-configmap
        volumeMounts:
        - name: penpot-vol
          mountPath: /opt/data
          subPath: penpot
      - name: penpot-backend
        image: penpotapp/backend
        envFrom:
        - configMapRef:
            name: penpot-configmap
        volumeMounts:
        - name: penpot-vol
          mountPath: /opt/data
          subPath: penpot
      - name: penpot-exporter
        image: penpotapp/exporter
        envFrom:
        - configMapRef:
            name: penpot-configmap
        env:
        - name: PENPOT_PUBLIC_URI
          value: "http://penpot-service"
      - name: penpot-postgresql
        image: postgres:14
        env:
        - name: POSTGRES_INITDB_ARGS
          value: "--data-checksums"
        - name: POSTGRES_DB
          value: "penpot"
        - name: POSTGRES_USER
          value: "penpot"
        - name: POSTGRES_PASSWORD
          value: "my-database-password"     # <-- change
        volumeMounts:
        - name: penpot-vol
          mountPath: /var/lib/postgresql/data
          subPath: postgres
      - name: penpot-redis
        image: redis:7
      volumes:
      - name: penpot-vol
        persistentVolumeClaim:
          claimName: penpot-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: penpot-service
  namespace: penpot
spec:
  ports:
  - port: 80
  selector:
    app: penpot-pod
---
apiVersion: v1
kind: Service
metadata:
  name: penpot-exporter
  namespace: penpot
spec:
  ports:
  - port: 6061
  selector:
    app: penpot-pod
---
apiVersion: v1
kind: Service
metadata:
  name: penpot-backend
  namespace: penpot
spec:
  ports:
  - port: 6060
    name: internal-communication
  - port: 6062
    name: internal-port
  selector:
    app: penpot-pod
```

kubectl apply -f deployment.yml

```yaml
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: penpot-route
  namespace: penpot
spec:
  entryPoints:
    - websecure
  tls:
    certResolver: le
  routes:
    - match: Host(`penpot.my-domain.com`)     # <-- change
      kind: Rule
      services:
        - name: penpot-service
          port: 80
```

kubectl apply -f ingress.yml

You can now access Penpot over https://penpot.my-domain.com.


## Creating UI designs
By default Penpot does not have assets you could use to create your mockups faster. Gladly the community created assets that can be downloaded here:
https://penpot.app/libraries-templates.html

To use them click on "Projects" and then on the plus. There you have the option to import the .penpot file.





## References
* OIDC tutorial https://help.penpot.app/technical-guide/configuration/#authentication-providers
* Environment variables https://github.com/penpot/penpot/blob/develop/docker/images/config.env