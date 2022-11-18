# Install Nextcloud

```
helm repo add nextcloud https://nextcloud.github.io/helm/
```

```
image:
    tag: "24.0.5"

nextcloud:
    host: "cloud.my-domain.com"
    password: "my-password"

mariadb:
    enabled: true
    password: "my-password"

persistence:
    enabled: true
    storageClass: longhorn
    nextcloudData:
        enabled: true
        storageClass: longhorn
        size: 500Gi

phpClientHttpsFix:
    enabled: true
```

Install Nextcloud with:
```
helm upgrade --install nextcloud nextcloud/nextcloud -f values.yml -n nextcloud --create-namespace
```


```
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: nextcloud-route
  namespace: nextcloud
spec:
  entryPoints:
    - websecure
  tls:
    certResolver: le
  routes:
    - match: Host(`cloud.my-domain.com`)   # <--change domain
      kind: Rule
      services:
        - name: nextcloud
          port: 8080
```

kubectl apply -f ingress.yml


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

To still sync your calendar you need to create a local user to which calendars you subscribe and your real user in Nextcloud shares this calendar with the sync user and lets them edit the calendars.

## References
* Tutorial is based on https://artifacthub.io/packages/helm/nextcloud/nextcloud#configuration
* Nextcloud SAML bug https://github.com/nextcloud/server/issues/32432#issuecomment-1222143890
* Details for SAML property mapping http://schemas.xmlsoap.org/claims/Group