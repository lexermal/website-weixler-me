# Install Fider

Create a file called **deployment.yml** with the following contend:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: fider-pvc
  namespace: my-fider
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
  name: fider-deployment
  namespace: my-fider
  labels:
    app: fider-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: fider-pod
  template:
    metadata:
      labels:
        app: fider-pod
    spec:
      containers:
      - name: postgres
        image: postgres:12
        env:
        - name: POSTGRES_USER
          value: fider
        - name: POSTGRES_PASSWORD
          value: "my-db-password"     # <-- change
      - name: fider
        image: getfider/fider:stable
        env:
        - name: BASE_URL
          value: "https://feedback.my-domain.com"     # <-- change
        - name: DATABASE_URL
          value: "postgres://fider:my-db-password@localhost:5432/fider?sslmode=disable"    # <-- change
        - name: JWT_SECRET
          value: my-jwt-token"     # <-- change
        - name: EMAIL_NOREPLY
          value: "feedback@my-domain.com"    # <-- change
        - name: EMAIL_SMTP_HOST
          value: "my-domain.com"           # <-- change
        - name: EMAIL_SMTP_PORT
          value: "587"                  # <-- change
        - name: EMAIL_SMTP_USERNAME
          value: "feedback@my-domain.com"            # <-- change
        - name: EMAIL_SMTP_PASSWORD
          value: "u24zZ?00v"                  # <-- change
        - name: EMAIL_SMTP_ENABLE_STARTTLS
          value: "true"
        volumeMounts:
        - name: fider-vol
          mountPath: /var/lib/postgresql/data
          subPath: db-data
      volumes:
      - name: fider-vol
        persistentVolumeClaim:
          claimName: fider-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: fider-service
  namespace: my-fider
spec:
  ports:
  - port: 3000
  selector:
    app: fider-pod
---
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: fider-route
  namespace: my-fider
spec:
  entryPoints:
    - websecure
  tls:
    certResolver: le
  routes:
    - match: Host(`feedback.my-domain.com`)     # <-- change
      kind: Rule
      services:
        - name: fider-service
          port: 3000
```

Adapt the values to your need, especially the email settings need to be set right for the first login where you will receive an email from the tool.

Then deploy the application with ```kubectl apply -f deployment.yml```.

Fider is now available via https://feedback.my-domain.com



## (optional) Configure SSO with Authentik

Create a OAuth2/OpenID Provider in Authentik with the following config:
* Name: Fider
* Authorization flow: Implicit
* Copy Client ID
* Copy Secret

Create an application with the following config:
* Name: Fider
* Slug: fider
* Provider: fider
* Launch URL: https://feedback.my-domain.com

In Fider under Settings -> Authentication -> Add new add the following values:
* Display Name: My feedback site
* Client ID: the copied client id
* Client secret: The copied client secret
* Authorize Url: https://auth.my-domain.com/application/o/authorize/
* Token Url: https://auth.my-domain.com/application/o/token/
* Scope: openid profile email
* Profile API URL: https://auth.my-domain.com/application/o/userinfo/
* ID: sub
* Name: name
* Email: email
* Status: Enabled

Then save the page and you are able to login via Authentik when you try to sign in.


## Resources
* Fider docu https://fider.io/docs/hosting-instance

* 
