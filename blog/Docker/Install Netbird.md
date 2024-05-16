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

## (optional) SSO group sync
In order to manage the users access permissions to certain servers set the following settings under System settings -> Groups:
* Enable user group propagation
* Enable JWT group sync

After a relogin the groups should be visible and should be assigned to the users.
Under access control the firewall rules can now be set in place for the dedicated user groups.

## (optional) Internal DNS server

Under DNS create a new DNS server entry with the following settings
* Nameserver IP: IP of ther dns server
* Port: The UDP port, can be different then 53
* Match domain: TLD your DNS server resolves e.g. my-domain.com
* Distribution groups: Clients that should use the DNS server

Hint: If the DNS server should be used within a Kubernetes cluster don't set the nodes as distribution groups. Rather install the Netbird client and setup DNS the Kubernetes way. Disable DNS management for this servers!

## Troubleshooting

**You configured a DNS server for your domain my-domain.com where you host things in your private network. auth.my-domain.com is hosted publically but from within your network, the pods can not reach it via curl. DNS resolution via nslookup works.**
Configure a public DNS server for all hosts in Netbird.
