# Install Gitlab on a K3s Cluster with auth via Authentik

This tutorial uses the helm charts of Pascaliske for installing Gitlab omnibus. They were chosen because the original Gitlab charts have a problem with CustomResourceDefinitions.

## Configure Authentik

Generate a Certificate-Key Pair with the following settings:
* Common Name Gitlab
* Validity days: 3650

Open the Gitlab certificate and copy the SHA1 certificate fingerprint for the idp_cert_fingerprint in the Gitlab values.yml file config parameter.

Create a SAML Provider with the following settings:
* Name: Gitlab
* Authorization flow: implicit
* ACS URL: https://git.my-domain.com/users/auth/saml/callback
* Issuer: https://git.my-domain.com
* Audience: https://git.my-domain.com
* Signing Certificate: Gitlab

Create an application with the following settings:
* Name: Gitlab
* Slug: gitlab
* Provider: Gitlab
* Launch URL: https://git.my-domain.com
## Install Gitlab
helm repo add pascaliske https://charts.pascaliske.dev

```
healthCheck:
  enabled: false
configMap:
  config: |
      external_url 'https://git.my-domain.com'
      gitlab_rails['initial_root_password'] = 'my-root-password'
      nginx['listen_https'] = false
      letsencrypt['enable'] = false
      grafana['enable'] = false
      gitlab_rails['gitlab_default_projects_features_issues'] = true
      gitlab_rails['gitlab_default_projects_features_wiki'] = true
      gitlab_rails['gitlab_default_projects_features_snippets'] = true
      gitlab_rails['gitlab_default_projects_features_container_registry'] = false
      prometheus_monitoring['enable'] = false
      gitlab_rails['omniauth_enabled'] = true
      gitlab_rails['omniauth_allow_single_sign_on'] = ['saml']
      gitlab_rails['omniauth_sync_email_from_provider'] = 'saml'
      gitlab_rails['omniauth_sync_profile_from_provider'] = ['saml']
      gitlab_rails['omniauth_sync_profile_attributes'] = ['email']
      gitlab_rails['omniauth_block_auto_created_users'] = false
      gitlab_rails['omniauth_auto_link_saml_user'] = true
      gitlab_rails['omniauth_providers'] = [
       {
          name: 'saml',
           args: {
        assertion_consumer_service_url: 'https://git.my-domain.com/users/auth/saml/callback',
        idp_cert_fingerprint: 'my-sha1 fingerprint',
        idp_sso_target_url: 'https://auth.my-domain.com/application/saml/gitlab/sso/binding/redirect/',
        issuer: 'https://git.my-domain.com',
        name_identifier_format: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
        attribute_statements: {
          email: ['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
          first_name: ['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
          nickname: ['http://schemas.goauthentik.io/2021/02/saml/username']
            }
           },
         label: 'Authentik'
       }
      ]
```

Install Gitlab with this command
```
helm upgrade --install gitlab pascaliske/gitlab -f values.yml -n gitlab --create-namespace
```
If you change settings in the values.yml file and run the upgrade command from above, you need to run this command in the pod to apply the changes ```gitlab-ctl reconfigure```.


## Make Gitlab reachable

```
ingress.yml  values.yml
root@stable-master:/k8-deployments/sumdays/gitlab/v2# cat ingress.yml
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: gitlab-route
  namespace: gitlab
spec:
  entryPoints:
    - websecure
  tls:
    certResolver: le
  routes:
    - match: Host(`git.my-domain.com`)   # <--change domain
      kind: Rule
      services:
        - name: gitlab
          port: 80
```

### Remarks
This installation of Gitlab is not perfect due to not using the original Gitlab helm charts. I would be happy if someone would show a way how to setup Gitlab on K3s with these charts.

## References
* Helm chart infos https://artifacthub.io/packages/helm/pascaliske/gitlab
* SSO integration with Authentik https://goauthentik.io/integrations/services/gitlab/
*