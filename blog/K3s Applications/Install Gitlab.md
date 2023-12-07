# Install Gitlab with SSO

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
We are going to install Gitlab in the gitlab namespace.

Preparations for installing Gitlab.
```bash
echo "fs.inotify.max_user_instances=1280" | sudo tee -a /etc/sysctl.conf
echo "fs.inotify.max_user_watches=655360" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

kubectl create namespace gitlab
kubectl create secret generic gitlab-gitlab-initial-root-password --from-literal=password=<password> -n gitlab
```

provider.yml
```yaml
name: saml
label: Authentik
args:
  assertion_consumer_service_url: 'https://git.my-domain.com/users/auth/saml/callback'
  idp_cert_fingerprint: my-sha1-fingerprint
  idp_sso_target_url: 'https://auth.my-domain.com/application/saml/gitlab/sso/binding/redirect/'
  issuer: 'https://git.my-domain.com'
  name_identifier_format: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'
  attribute_statements:
    email:
      - 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
    first_name:
      - 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
    nickname:
      - 'http://schemas.goauthentik.io/2021/02/saml/username'
```

```bash
kubectl create secret generic -n gitlab saml-oauth2 --from-file=provider=provider.yml
```

values.yml
```yaml
global:
  edition: ce
  appConfig:
    omniauth:
      enabled: true
      autoLinkSamlUser: true
      blockAutoCreatedUsers: false
      syncProfileFromProvider:
      - saml
      providers:
       - secret: saml-oauth2
  hosts:
    domain: sumdays.org
    gitlab:
      name: git.sumdays.org
      https: true
  ingress:
    class: traefik
    provider: traefik
    configureCertmanager: false
certmanager:
  install: false
nginx-ingress:
  # Disable the deployment of the in-chart NGINX Ingress provider.
  enabled: false
registry:
  enabled: false
gitlab-runner:
  install: false
  runners:
    privileged: true
gitlab:
  initialRootPassword:
    secret: gitlab-initial-root-password
    key: password
prometheus:
  install: false
```

```bash
helm repo add gitlab http://charts.gitlab.io/
helm upgrade --install gitlab gitlab/gitlab -f values.yml -n gitlab --create-namespace
```

## (optional) Setup Gitlab runner

```bash
helm repo add gitlab http://charts.gitlab.io/
```

```yaml
gitlabUrl: https://git.my-domain.com       # <-- change
runnerToken: your-token       # <-- change
logLevel: debug
runners:
  config: |
    [[runners]]
      [runners.kubernetes]
        image = "ubuntu:23.04"
        privileged = true
      [[runners.kubernetes.volumes.empty_dir]]
        name = "docker-certs"
        mount_path = "/certs/client"
        medium = "Memory"
```

```
helm install -n gitlab gitlab-runner -f values.yml gitlab/gitlab-runner --create-namespace
```


## References
* Helm chart infos https://artifacthub.io/packages/helm/gitlab/gitlab
* Gitlab SSO provider configuration https://docs.gitlab.com/charts/charts/globals#providers
* SSO integration with Authentik https://goauthentik.io/integrations/services/gitlab/
* Instructions for Runner https://docs.gitlab.com/runner/install/kubernetes.html
