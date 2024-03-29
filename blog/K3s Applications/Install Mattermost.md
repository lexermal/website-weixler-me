# Install Mattermost


```
helm repo add mattermost https://helm.mattermost.com
```


```
ingress:
  enabled: true
  annotations:
    kubernetes.io/ingress.class: traefik
  hosts:
    - chat.my-domain.com
  tls:
    - hosts:
      - chat.my-domain.com
mysql:
  mysqlUser: msadmin
  mysqlRootPassword: my-password
  mysqlPassword: my-password
securityContext:
  fsGroup: 2000
  runAsGroup: 2000
  runAsUser: 2000
```    

```
helm upgrade --install mattermost mattermost/mattermost-team-edition -f values.yml -n mattermost --create-namespace
```

## Configure SSO

The free version of Mettermost only allowes SSO via Gitlab. 
For this tutorial we assume you have already a running Gitlab instance. It can handle the authentification on its own or be connected to an SSO service on its own, like Authentik.

### Configure Gitlab
In Gitlab click on the burger menu -> Admin -> Applications -> New Application and set the following settings:
* Name: Mattermost
* Redirect urls: 
```
https://chat.my-domain.com/login/gitlab/complete
https://chat.my-domain.com/signup/gitlab/complete
```
* Trusted: checked
* Scopes: api

Save the form and copy the Application ID and Secret for Mattermost.

### Configure Mattermost:

Login as admin and click on System Console -> Authentification -> Gitlab.
Enter the following settings:
* Enable authentication with GitLab: true
* Application ID: id you copied from Gitlab
* Application Secret Key: Key you copied from Gitlab
* Gitlab Site URL: https://chat.my-domain.com

Safe the settings. 

Congratulations you can now login to your Mattermost instance via Gitlab!

Make sure you make one OAuth user admin!

# (optional) Enable Jitsi plugin

Add the following to the values.yml file and deploy the application again.
```
extraEnvVars:
   - name: MM_PLUGINSETTINGS_ENABLEUPLOADS
     value: "TRUE"
```
Build the plugin like described [here](https://github.com/mattermost/mattermost-plugin-jitsi).

Upload the gz file in Mattermost Settings under "Plugins".

Enable it and you can make your first calls!





## References
* Docu for installation of Mattermost: https://artifacthub.io/packages/helm/mattermost/mattermost-team-edition
