# Install Taiga with SSO

When a user signs up it does not work but if the user exists before login is possible.

So the following works:
1. In Taiga registering user
2. Login via Authentik
   

## Create admin

docker exec -it sumday-taiga-taiga-back-1
 python manage.py createsuperuser

## References
* Nginx config file for routing https://github.com/kaleidos-ventures/taiga-docker/blob/main/taiga-gateway/taiga.conf
* Taiga Oauth Library https://github.com/robrotheram/taiga-contrib-openid-auth