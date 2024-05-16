# Install Harbor


```
helm repo add harbor https://helm.goharbor.io
```


```yaml
expose:
    tls:
        certSource: secret
        secret:
            secretName: harbor-ssl
    ingress:
        annotations:
            kubernetes.io/ingress.class: traefik
            cert-manager.io/cluster-issuer: letsencrypt-production
    hosts:
      core: registry.my-domain.com
      notary: notary.my-domain.com
externalURL: https://registry.my-domain.com
harborAdminPassword: my-password
secretKey: my-password  # has to be 16 characters
registry:
  credentials:
    username: reg_admin
    password: my-password
database:
  internal:
    password: my-password

# optional
trivy:
    enabled: false
notary:
    enabled: false
```    


```
helm upgrade --install harbor harbor/harbor -f values.yml -n harbor --create-namespace
```

## Configure SSO

Create an OAuth2/OpenID Provider in Authentik with the following config:
* Name: Harbor
* Authorization flow: Implicit
* Copy Client ID
* Copy Secret
* Redirect URIs: https://registry.my-domain.com/c/oidc/callback
* Signing Key: authentik RSA key

Create an application with the following config:
* Name: Harbor
* Slug: harbor
* Provider: Harbor
* Launch URL: https://registry.my-domain.com

In the administration of Harbor, set in the Configuration the following settings:
* Auth mode: OIDC
* Provider Name: authentik
* OIDC Endpoint: https://auth.my-domain.com/application/o/harbor/
* OICD Client ID: Enter the copied id
* OIDC Client Secret: Enter the copied secret
* Group Claim Name: groups
* OIDC Admin Group: authentik Admins
* OIDC Scope: openid,profile,email
* Verify Certificate: checked
* Automatic onboarding: checked
* Username Claim: preferred_username

## References
* Habor SSO https://goharbor.io/docs/1.10/administration/configure-authentication/oidc-auth/
* Authentik docu for Harbor https://goauthentik.io/integrations/services/harbor/
* Inspiration for fixing SSL issue: https://github.com/goharbor/harbor-helm/issues/582

