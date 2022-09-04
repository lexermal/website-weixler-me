# Set up a simple application in Kubernetes

Today we are going to set up a simple application in Kubernetes that consists of a Web service and a service on custom port. For that we will use a Minecraft Server with the plugin [Dynmap](https://github.com/webbukkit/dynmap).

The Minecraft server will be reachable from the internet and the data of an already existing Minecraft server will be migrated.

**Preconditions**: For this setup we assume we have a running instance of a Minecraft server, and we have a Kubernetes cluster with K3s and Longhorn in which the application should run.

We will do the following steps:
1. Set up a new Minecraft server in Kubernetes
2. Make it reachable from the internet
3. Migrate the data of the existing Server to a Kubernetes volume


## 1. Set up a new Minecraft server in Kubernetes

First of we have to create a namespace in which the application can safely run with:

```kubectl create namespace family-minecraft```

The name of the namespace can be chosen as one pleases. A recommendation is to use one keyword for a grouping and then the application name. In this example this Minecraft service is one of the services that run for the family.


Next we create the configuration for the Minecraft server. This contains a volume in which the data gets saved, the application itself and a service for telling Kubernetes what ports the server has:

```yml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: family-minecraft-pvc
  namespace: family-minecraft
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: longhorn
  resources:
    requests:
      storage: 10Gi # <-- volume size
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: family-minecraft-deployment
  namespace: family-minecraft
  labels:
    app: family-minecraft-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: family-minecraft-pod
  template:
    metadata:
      labels:
        app: family-minecraft-pod
    spec:
      containers:
      - name: family-minecraft-container
        image: cmunroe/spigot # <-- the docker image
        env:
        - name: EULA # <-- the enviroment variables
          value: "TRUE"
        - name: SNOOPER_ENABLED
          value: "FALSE"
        - name: DIFFICULTY
          value: "2"
        - name: MOTD
          value: "My Kubernetes MC Server"
        - name: PVP
          value: "FALSE"
        - name: ONLINE_MODE
          value: "TRUE"
        - name: RESOURCE_PACK
          value: "https://github.com/FaithfulTeam/Faithful/raw/releases/1.18.zip"
        - name: MaxRAM
          value: "2048m"
        volumeMounts:
        - name: family-minecraft-vol
          mountPath: /data # <-- the mount path of the volume
      volumes:
      - name: family-minecraft-vol
        persistentVolumeClaim:
          claimName: family-minecraft-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: family-minecraft-service
  namespace: family-minecraft
spec:
  type: LoadBalancer # <-- needs to be set when a non http service should be reachble
  ports:
  - port: 25565 # <-- Minecraft game port
    protocol: TCP
  - port: 8123  # <-- port of Minecraft plugin Dynmap(http)
  selector:
    app: family-minecraft-pod
```

There are so many sections in the configuration. What do they even mean?

* The first section is the PersistentVolumeClaim.
It tells Kubernetes that we want to have a volume for our data with the size of 10GB.

* Next we have the deployment. It contains all the configurations needed to let the application running in the cluster. Similar to a docker-compose file for docker like the container image and environment variables.

* The last section is the service section. With the help of Dynmap the Minecraft server should show a map of the world as website. For that to work the services makes the content of that plugin, that is running on port 8123 accessible within the cluster. The same happens with the Minecraft game port.

Now that we know what the configuration does we can adapt it to our needs and save it as ```minecraft-deployment.yml``` on a host that has kubectl configured for our Kubernetes Cluster.

Then we deploy the application to the cluster by executing the following command in the folder where the configuration is:

```kubectl apply -f .```

Now the Minecraft server is successfully running in our Kubernetes cluster.
## 2. Make the Minecraft game reachable
To be able to play on this Minecraft Server reachable we need to open the port 25565. Therefore, we need to create the following configuration:

```yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: family-minecraft-game-port-configmap
  namespace: family-minecraft
data:
  25565: "family-minecraft/family-minecraft-service:25565"
```

Paste the content in a file in the same folder as your deployment, save it as ```minecraft-game-port-ingress.yml``` and execute ```kubectl apply -f .```

Well done, our Minecraft server is now reachable from outside the cluster! We can access it by entering the public IP address of the master node in the Minecraft Java client.

## 2. Make Dynmap be reachable

Now it's time for the HTTP service Dynmap to be reachable from outside the cluster. This is done by using an Ingress.

Because this cluster is set up with K3s we use the IngressRoute of Traefik:

```yml
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: family-minecraft-route
  namespace: family-minecraft # <-- used namespace from before
spec:
  entryPoints:
    - websecure
  tls:
    certResolver: le
  routes:
    - match: Host(`minecraft.my.domain.com`) # <-- domain name for Dynmap
      kind: Rule
      services:
        - name: family-minecraft-service # <-- service name of the deployment
          port: 8123 # <-- port on which Dynmap runs
```

Paste that content in a file in the same folder as the deployment, adjust it to your needs and execute ```kubectl apply -f .```

Now the HTTP service of the Minecraft Plugin is accessible from the website https://minecraft.my.domain.com. Currently, we can't test it out because the plugin is not installed yet. If you open the website a "Bad Gateway" message will be shown.

## 3. Migrate the game data and install Dynmap

For this new Minecraft server to have the game map and settings, we need to migrate all data from the old Minecraft server.

For this we need to switch to the family-minecraft namespace in kubectl with

```kubectl config set-context --current --namespace=family-minecraft```

Then we need to stop the application with

 ```kubectl scale --replicas=0 deployment family-minecraft-deployment```

The next step is to mount the volume of the application. To be able to do that we need to find it when it's attached to the host.

Therefore, ssh into the master node and execute the following command ```fdisk -l | grep Disk```. It shows all the available disks.

The output should look like this
```bash
Disk /dev/vda: 800 GiB, 858993459200 bytes, 1677721600 sectors
Disklabel type: gpt
Disk identifier: XXXXXXX-XXXX-XXXX-XXXXXXXX
Disk /dev/sdd: 500 GiB, 536870912000 bytes, 1048576000 sectors
Disk model: VIRTUAL-DISK
Disk /dev/sdb: 10 GiB, 10737418240 bytes, 20971520 sectors
Disk model: VIRTUAL-DISK
```

This disks are not the volume we need. For ours to show up go to the volume page of the Longhorn UI, select the volume in the **family-minecraft** namespace and click on attach. Then select the Master Node.

Now the output of ```fdisk -l | grep Disk``` should look like this:

```bash
Disk /dev/vda: 800 GiB, 858993459200 bytes, 1677721600 sectors
Disklabel type: gpt
Disk identifier: XXXXXXX-XXXX-XXXX-XXXXXXXX
Disk /dev/sdd: 500 GiB, 536870912000 bytes, 1048576000 sectors
Disk model: VIRTUAL-DISK
Disk /dev/sdb: 10 GiB, 10737418240 bytes, 20971520 sectors
Disk model: VIRTUAL-DISK
Disk /dev/sda: 10 GiB, 10737418240 bytes, 20971520 sectors
Disk model: VIRTUAL-DISK
```

We see the virtual disk **/dev/sda** got added. That's the one we want to mount.

This works with

```bash
sudo mkdir /tmp/folder
sudo mount /dev/sda /tmp/folder
```

We can now copy the game data via SCP or SSH in that folder and install the plugin Dynmap.

After that we unmount the volume with ```umount /dev/sda```

In the Longhorn UI we detach the volume.

Now we can start the Minecraft server again with

 ```kubectl scale --replicas=1 deployment family-minecraft-deployment```

Congratulations, after 2 minutes when the server started up we can see the game map on https://minecraft.my.domain.com


## Additional resources

Additions infos about [making TCP and UDP services reachable](https://kubernetes.github.io/ingress-nginx/user-guide/exposing-tcp-udp-services/).

The part with migrating the data is based on [this](https://github.com/longhorn/longhorn/issues/265#issuecomment-770968271).