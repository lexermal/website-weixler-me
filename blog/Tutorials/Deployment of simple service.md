# Setup of a simple service in Kubernetes using the example of a Minecraft server

Hello, this tutorial will show you how to setup a simple service in Kubernetes(k3s) that is reachable from ouside the cluster and shows a map of the world as website(dynmap). It will also describe how to make HTTP services and custom services reachable from outside the cluster.

## Situation

Let's assume you have a running instance of an application you want to move into your Kubernetes cluster that is set up with K3s and Longhorn.

That means we need to do the following steps:
1. Fresh set up the new application in Kubernetes
2. Move the data of the old application to the volume of the cluster

## 1. Fresh setup of a new service in Kubernetes

For setting up our new Minecraft server we need to create a deployment. The following one contains already all parts needed for the application to run successfully:

```yml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: longhorn-family-minecraft-application
  namespace: family-minecraft
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: longhorn
  resources:
    requests:
      storage: 10Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: family-minecraft-application-deployment
  namespace: family-minecraft
  labels:
    app: family-minecraft-application-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: family-minecraft-application-pod
  template:
    metadata:
      labels:
        app: family-minecraft-application-pod
    spec:
      containers:
      - name: family-minecraft-application-container
        image: cmunroe/spigot
        env:
        - name: EULA
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
        - name: vol-application
          mountPath: /data
      volumes:
      - name: vol-application
        persistentVolumeClaim:
          claimName: longhorn-family-minecraft-application
---
apiVersion: v1
kind: Service
metadata:
  name: minecraft-application-service
  namespace: family-minecraft
spec:
  type: LoadBalancer
  ports:
  - port: 25565
    name: mc-port
    protocol: TCP
  - port: 8123
    name: dynmap-port
  selector:
    app: family-minecraft-application-pod

```

Normally every yml file can only have one root entry. But by using ```---``` it is possible. It's like writing the content of multiple yml files into one. That way there is no need to edit many small files and have mistakes of naming services and having to look them up in the other files.

The first section is the PersistentVolumeClaim.
It tells Kubernetes that we want to have a volume for our data with the size of 10GB.

Next we have the deployment.
It contains all the configurations needed to let the application running in the cluster. Similar to a docker-compose file for docker.

Here the container image is *cmunroe/spigot* and there are some environment variables like the resource pack set.

The last section is the service section. We want the Minecraft server to show a map of the world as website and to be reachable from outside the cluster. Website of the world is later on achieved with a plugin called Dynmap. For that to work the services makes the content of that plugin, that is running on port 8123 accessible inside the cluster.

Copy the content of that yml snippet to a host on which kubectl is configured. Adapt it to your needs and deploy the application to your cluster by executing ```kubectl apply -f .```

## 2. Make a TCP service reachable from outside the cluster
To make the Minecraft Server reachable we need to open the port. This is done by a configMap:

```yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: family-minecraft-configmap-game-port
  namespace: family-minecraft
data:
  25565: "family-minecraft/minecraft-application-service:25565"
```

Paste that content in a file in the same folder as your deployment and execute ```kubectl apply -f .```

Now you can connect to the Minecraft Server by entering the public IP address of the master node or by using the domain pointing to the master node.

## 2. Make an HTTP service be reachable from outside the cluster

To make a simple HTTP service reachable we need to make the port we exposed to the cluster be routed to the public. This is done by using an Ingress.

Because this cluster is set up with K3s we use the IngressRoute of Traefik:

```yml
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: family-minecraft-route
  namespace: family-minecraft
spec:
  entryPoints:
    - websecure
  tls:
    certResolver: le
  routes:
    - match: Host(`minecraft.my.domain.com`)
      kind: Rule
      services:
        - name: minecraft-application-service
          port: 8123

```

Here it's important to use the service name of the service we configured before and to use the name namespace.

Paste that content in a file in the same folder as your deployment and execute ```kubectl apply -f .```

Now the HTTP service of the container is accessible from the website https://minecraft.my.domain.com. If you open that website you will be presented with a "Bad Gateway" message because the Minecraft server has not yet installed the plugin. This will be done in the next step.

## 3. Migrate the data from the old application
This part is based on https://github.com/longhorn/longhorn/issues/265#issuecomment-770968271

Change namespace to family-minecraft with ```kubectl config set-context --current --namespace=family-minecraft```

Stop the service with ```kubectl scale --replicas=0 deployment family-minecraft-application-deployment```

To be able to mount the volume we need to find it when it's attached to the host. Therefore execute on the Cluster master ```fdisk -l | grep Disk```. It shows all the available disks. The volume will appear there after the next step.

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

Then go to the volume page of the GUI of Longhorn, select the volume you want to edit the files and click on attach. Select the Master Node.

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

You see at the end a new Virtual Disk got added. That's the one we want to mount.

This goes with

```bash
sudo mkdir /tmp/folder
sudo mount /dev/sda /tmp/folder
```

Copy your data you want to move into that folder. Also install the Plugin Dynmap.

When finished unmount the volume with ```umount /dev/sda```

In longhorn UI detach the volume.


Start the service again with ```kubectl scale --replicas=1 deployment family-minecraft-application-deployment```

After the service started the map of the world is reachable via https://minecraft.my.domain.com


## Additional resources

To find out more on how to make TCP and UDP services reachable conduct https://kubernetes.github.io/ingress-nginx/user-guide/exposing-tcp-udp-services/