# Install Wordpress

Add the chart repo with the following command:
```
helm repo add wordpress https://charts.bitnami.com/bitnami
```

Create a **values.yml** file with the following content:
```
wordpressUsername: admin
wordpressPassword: my-admin-password   # <-- change
mariadb:
    auth:
        rootPassword: my-db-password   # <-- change
ingress:
    enabled: true
    ingressClassName: traefik
    hostname: wp.my-domain.com   # <-- change
    tls: true
    annotations:
        cert-manager.io/cluster-issuer: letsencrypt-production
```

Install Wordpress with the following command:
```
helm upgrade --install wordpress wordpress/wordpress -f values.yml -n wordpress --create-namespace
```


## (optional) Connect WordPress with Authentik

Use this tutorial: https://goauthentik.io/integrations/services/wordpress/


## References
* Deployment parameters https://artifacthub.io/packages/helm/bitnami/wordpress
