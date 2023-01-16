# Install Vaultwarden.

Add the repository with:
```helm repo add gissilabs https://gissilabs.github.io/charts/```


```
ingress:
  enabled: true
  className: traefik
  host: vaultwarden.my-domain.com
  annotations: 
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    traefik.ingress.kubernetes.io/router.tls.certResolver: le
persistence:
  enabled: true
vaultwarden:
  domain: "https://vaultwarden.my-domain.com"
  allowSignups: false
  smtp:
    enabled: false
  admin:
    enabled: true
    token: my-random-access-token
```

Install Vaultwarden now with:
```helm upgrade --install vaultwarden gissilabs/vaultwarden -f values.yml -n vaultwarden --create-namespace```



## Create user

In order to setup the first user you need to access the admin interface of Vaultwarden with https://vaultwarden.my-domain.com/admin.

Login with the access token used in the values.yml file.

Under "users" invite a user. The user can later create its account via the registration form.

## Sharing passwords
If you want to share some passwords with other users create an organization.

Then click on "Manage" and "Collections" the collections are like folders that can be shared with other users.


## References
* Helm values: https://artifacthub.io/packages/helm/gissilabs/vaultwarden?modal=values
* Enable admin panel: https://github.com/dani-garcia/vaultwarden/wiki/Enabling-admin-page
