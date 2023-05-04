# Install ERPNext

```
helm repo add frappe https://helm.erpnext.com
```


```
ingress:
  enabled: true
  className: traefik
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    traefik.ingress.kubernetes.io/router.tls.certResolver: le
  hosts:
  - host: erp.my-domain.com
    paths:
    - path: /
      pathType: ImplementationSpecific
persistence:
  worker:
   storageClass: longhorn
mariadb:
  auth:
    rootPassword: my-password  # <-- change
    password: my-password  # <-- change
    replicationPassword: my-password  # <-- change
jobs:
  createSite:
    enabled: true
    siteName: erp.my-domain-com    # <-- change
    adminPassword: my-password  # <-- change
```


```
helm upgrade --install frappe-bench frappe/erpnext -f values.yml -n my-erpnext --create-namespace
```
Wait till all pods are running, then give the application 5 min to initialize.

You can now enter the page via https://erp.my-domain.com

Username: Administrator
Password: the one you set in values.yml

## (optional) Configure SSO

### Configure Authentik
Create a OAuth2/OpenID Provider with the following settings:
* Name: ERPNext
* Authorization flow: Inplicit
* Client ID: copy it for later
* Client Secret: copy it for later
* Redirect URIs: https://erp.my-domain.com/api/method/frappe.integrations.oauth2_logins.custom/authentik
* Signing Key: authentik Self-signed Certificate

Create an Application with the following settings:
* Name: ERPNext
* Slug: erpnext
* Provider: ERPNext

### Configure ERPNext

Under Integrations -> Social Login Key add a new Social Login Key with the following settings:
* Enable Social Login: check
* Social Login Provider: Custom
* Provider Name: Authentik
* Client ID: paste from Authentik 
* Client Secret: paste from Authentik
* Base URL: https://auth.my-domain.com
* Authorize URL: /application/o/authorize/
* Redirect URL: /api/method/frappe.integrations.oauth2_logins.custom/authentik
* Access Token URL: /application/o/token/
* API Endpoint: /application/o/userinfo/
* Auth URL Data: {"response_type": "code", "scope": "openid profile email"}

Save the settings.
Navigate to Website -> Website Settings -> Login Page and uncheck "Disable Signup". It's needed for the SSO users to login for the first time. No worries other people signing in using the webform are not able to access any information of ERPNext.

You can now login with SSO by nativating to https://erp.my-domain.com/login and clicking on "Login with Authentik".

### Install HR module

Copy values.yml to custom-values.yaml

Adapt the following content:
jobs:
  createSite:
    enabled: true
    siteName: hrm.my-domain.com
    adminPassword: my-admin-password
    installApps:
    - hrms

helm template frappe-bench -n my-erpnext frappe/erpnext -f custom-values.yaml -s templates/job-create-site.yaml > create-site-job.yml

Adapt **create-site-job.yml** at around line 57 where it says *bench get-app hrms* replace it with:
```
bench get-app hrms && bench new-site $(SITE_NAME)
```
kubectl apply -f create-site-job.yml

helm template frappe-bench -n my-erpnext frappe/erpnext -f custom-values.yaml -s templates/ingress.yaml > hrm-ingress.yml

kubectl apply -f hrm-ingress.yml



## References
* Helm chart config https://artifacthub.io/packages/helm/erpnext/erpnext?modal=values&path=persistence
* User credentials https://verystrongfingers.github.io/erpnext/2021/02/11/erpnext-k3s.html
* Job creation details https://github.com/frappe/helm/blob/main/erpnext/README.md
* SSO config hints https://discuss.frappe.io/t/using-a-custom-social-login-provider-authentik/94812
* SSO first login flag docu https://docs.erpnext.com/docs/v13/user/manual/en/website/articles/disable-signup
* Frappe HR install infos https://github.com/frappe/hrms
