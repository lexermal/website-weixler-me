# Setup Netbird with Authentik

## Assuptions
* Netbird is reachable over vpn.my-domain.com
* Authentik is reachable over auth.my-domain.com

Follow this guide to setup Netbird https://docs.netbird.io/selfhosted/selfhosted-guide

setup.env:
```
NETBIRD_DOMAIN="vpn.my-domain.com"
NETBIRD_AUTH_OIDC_CONFIGURATION_ENDPOINT="https://auth.my-domain.com/application/o/netbird/.well-known/openid-configuration"
NETBIRD_AUTH_AUDIENCE="my-client-id"
NETBIRD_AUTH_CLIENT_ID="my-client-id"
NETBIRD_AUTH_SUPPORTED_SCOPES="openid profile email offline_access api"
NETBIRD_USE_AUTH0="false"
NETBIRD_AUTH_DEVICE_AUTH_PROVIDER="none"
NETBIRD_AUTH_DEVICE_AUTH_CLIENT_ID="my-client-id"
NETBIRD_AUTH_DEVICE_AUTH_AUDIENCE=$NETBIRD_AUTH_AUDIENCE
NETBIRD_MGMT_IDP="authentik"
NETBIRD_IDP_MGMT_CLIENT_ID=$NETBIRD_AUTH_CLIENT_ID
NETBIRD_IDP_MGMT_EXTRA_USERNAME="Netbird"
NETBIRD_IDP_MGMT_EXTRA_PASSWORD="my-client-password"
NETBIRD_DISABLE_LETSENCRYPT=false
NETBIRD_LETSENCRYPT_EMAIL="contact@my-domain.com"
NETBIRD_MGMT_DNS_DOMAIN=vpn.local
```
