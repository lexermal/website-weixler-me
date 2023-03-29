# (DRAFT) Install LimeSurvey

```
helm repo add martialblog https://martialblog.github.io/helm-charts
```




```
mariadb:
  enabled: true
  auth:
    rootPassword: my-root-password   # <--change
    password: my-database-password   # <--change
limesurvey:
  admin:
    password: my-admin-password   # <--change
  persistence:
    storageClassName: longhorn
ingress:
  enabled: true
  className: traefik
  annotations:
      traefik.ingress.kubernetes.io/router.entrypoints: websecure
      traefik.ingress.kubernetes.io/router.tls.certResolver: le
  hosts:
    - host: survey.my-domain.com
      paths:
        - path: /
          pathType: ImplementationSpecific
```


```
helm upgrade --install limesurvey martialblog/limesurvey -f values.yml -n limesurvey --create-namespace
```

## Setup LDAP

Settings of LimeSurvey in LDAP plugin:
ldap://ak-outpost-ldap-outpost.authentik.svc.cluster.local
389
prefix: cn=
suffix: ,OU=Users,DC=ldap,DC=goauthentik,DC=io
compare: cn
baseDn: DC=ldap,DC=goauthentik,DC=io
mail
displayName
all checked

### Settings in Authentik

Settings of LDAP Provider:
* Name: Limesurvey
* Search group: The group that should have access
* Base DN: Copy this one for later

Application settings:
* Name: Limesurvey
* Provider: Limesurvey
* Launch URL: https://survey.my-domain.com

Outpost settings:
* Name: LDAP outpost
* Type: LDAP
* Applications: Limesurvey


# **Currently, there is a bug in the ldap plugin that prevents it from loggin in the users**
https://forums.limesurvey.org/forum/plugins/128491-error-when-authenticating-using-authldap-auto-create-user-fails

So setup is postponed

 ldapsearch -H ldap://auth.my-domain.com -x  -D CN=my-ldap-user,OU=Users,DC=ldap,DC=goauthentik,DC=io -w my-ldap-password

Interesting thing about mapped properties, maybe that's the final mistake https://goauthentik.io/docs/property-mappings/#saml-property-mapping

Further hint on how to make ldap work https://www.reddit.com/r/selfhosted/comments/ys6n76/authentik_ldap_in_calibreweb/

## References
* https://artifacthub.io/packages/helm/martialblog/limesurvey
* https://goauthentik.io/docs/providers/ldap
* https://www.reddit.com/r/selfhosted/comments/sp9vlb/comment/hwj5oss/
* https://imgur.com/a/ETibGMH
* https://blog.unixfy.net/replacing-ad-with-authentik-ldap-outpost-in-jira/
* https://manual.limesurvey.org/Authentication_plugins
* https://devconnected.com/how-to-search-ldap-using-ldapsearch-examples/
* https://artifacthub.io/packages/helm/martialblog/limesurvey?modal=values
* Internal access to other services https://stackoverflow.com/questions/37221483/service-located-in-another-namespace
