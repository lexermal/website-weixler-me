# Install Minecraft Server

Create a file named values.yml with the following content:

```
minecraftServer:
    eula: "TRUE"
    type: "PAPER"
    paperDownloadUrl: "https://api.papermc.io/v2/projects/paper/versions/1.19.2/builds/191/downloads/paper-1.19.2-191.jar"
    difficults: normal
    spawnProtection: 0
    motd: "My Minecraft Server"
    resourcePackUrl: "https://github.com/FaithfulTeam/Faithful/raw/releases/1.18.zip"
    onlineMode: true
    ops: "user1,user2,user3"
    overrideServerProperties: true
    serviceType: LoadBalancer
    rcon:
        enabled: true
        serviceType: LoadBalancer
        password: "my-rcon-password"
persistence:
    stoargeClass: "longhorn"
    dataDir:
        enabled: true
        Size: 5Gi
resources:
  requests:
    memory: 2Gi
    cpu: 1
  limits:
    memory: 3Gi
    cpu: 6

mcbackup:
    dataDir:
        enabled: true
        Size: 5Gi
    pauseIfNoPlayers: "true"
    persistence:
        storageClass: "longhorn"
```
Change the settings to your likening.

Install the server with
```
helm upgrade --install minecraft minecraft-server-charts/minecraft -f values.yml -n minecraft --create-namespace
```

Congrats the server is now reachable on port 25565.

You can now install all plugins you like. It's easiest to open a shell window to that container, go into the plugins folder and download the plugins with wget.

## Make dynmap available
When you have installed some plugins like Dynmap that are HTTP services and should be reachable we will make them reachable now.

Create a file named **config.yml** and add the following contend:
```
apiVersion: v1
kind: Service
metadata:
  name: family-minecraft-service
  namespace: minecraft
spec:
  ports:
  - port: 8123
  selector:
    app: minecraft-minecraft
----
kind: IngressRoute
metadata:
  name: family-minecraft-route
  namespace: minecraft
spec:
  entryPoints:
    - websecure
  tls:
    certResolver: le
  routes:
    - match: Host(`minecraft.my-domain.com`) # <-- domain name for Dynmap
      kind: Rule
      services:
        - name: family-minecraft-service
          port: 8123
```
Apply the config with ```kubectl apply -f config.yml```.

Congrats Dynmap is now reachable via https://minecraft.my-domain.com.



## Remarks
* Helm charts and config can be found here https://artifacthub.io/packages/helm/minecraft-server-charts/minecraft?modal=values