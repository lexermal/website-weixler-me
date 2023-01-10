# Install Nextcloud

Add Helm charts with:

```bash
helm repo add nextcloud https://nextcloud.github.io/helm/
```
Create a file called values.yml for the deployment settings with the following contend:

```yaml
ingress:
    enabled: true
    className: traefik
    annotations:
      traefik.ingress.kubernetes.io/router.entrypoints: websecure
      traefik.ingress.kubernetes.io/router.tls.certResolver: le
    tls:
      - hosts:
          - cloud.my-domain.com   # <-- change
nextcloud:
    host: "cloud.my-domain.com"   # <-- change
    password: "my-password"   # <-- change
mariadb:
    enabled: true
    password: "my-password"   # <-- change
persistence:
    enabled: true
    nextcloudData:
        enabled: true
        size: 100Gi   # <-- change

phpClientHttpsFix:
    enabled: true
```

Install Nextcloud with:
```
helm upgrade --install nextcloud nextcloud/nextcloud -f values.yml -n nextcloud --create-namespace
```



## (optional) Connect Nextcloud with Authentik

https://blog.cubieserver.de/2022/complete-guide-to-nextcloud-saml-authentication-with-authentik/

Hint: The Metadata stays always invalid.

At the end you need to disable the app "circles" in Nextcloud. Otherwise, a Status 500 error will be thrown when the user tries to log in for the first time. It's a bug. Details can be found in References.

## Login without SAML

As admin it might be that you want to login into Nextcloud without SAML to configure stuff.
This can be achieved with this url: https://cloud.my-domain.com/login?direct=1

### Enable admin group management over Authentik
In order to let users be admins there need to change some configuration in Authentik.

Create a group called "Cloud Admins" that contains the users you want to be admins for Nextcloud.

In "Property Mapping" create a SAML property mapping with the following settings:
* Name: Cloud group mapping
* SAML Attribute name: http://schemas.xmlsoap.org/claims/Group
* Expression:
```
for group in user.ak_groups.all():
    yield group.name
if ak_is_group_member(request.user, name="Cloud Admins"):
    yield "admin"
```

Open the SAML Provider for your Nextcloud, open the advanced protocol settings, unselect "authentik default SAML mapping: Groups" and select "Cloud group mapping".

Done. Now the users of group Cloud Admins will be admins starting from the next time they log in.

## (optional) Making calendar sync work

The calendar API works only with local users, not SAML / SSO users.

Create a access password in Nextcloud via the user profile settings at the bottom.

OR create a local user to which calendars you subscribe and your real user in Nextcloud shares this calendar with the sync user and lets them edit the calendars.



## References
* Tutorial is based on https://artifacthub.io/packages/helm/nextcloud/nextcloud#configuration
* Nextcloud SAML bug https://github.com/nextcloud/server/issues/32432#issuecomment-1222143890
* Details for SAML property mapping http://schemas.xmlsoap.org/claims/Group
