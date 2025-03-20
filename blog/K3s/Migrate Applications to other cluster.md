# Migrate Applications to other cluster

## On old server
1. Upgrade the application to the newest version
2. Scale the application down to 0
3. Attach PVCs to the server via Longhorn UI
4. Create a folder in tmp for mounting, it should be explainable like the application name and PVC size e.g. mount-gitlab-30gb
5. Mount all PVCs with ```mount /dev/longhorn/pvc-name /tmp/mount-gitlab-30gb/```
6. Go in the directory with ```cd mount-gitlab-30gb```
7. Compress ```tar czvf ../${PWD##*/}.tar.gz .```
8. Copy tared files to new server

Or you use this script to do it automatically:

Hint: Make sure the PVC is "attached" in Longhorn.
```
#!/bin/bash

# call with: bash pvc-export.sh my-pvc-id my-pvc-name

# Take in parameters
PVC="$1"
PVCNAME="$2"

echo "Working with PVC $PVC having the name '$PVCNAME'"

cd /var/lib/longhorn/replicas
PVCDIR=$(find "/var/lib/longhorn/replicas" -type d -name "${PVC}*" -exec basename {} \;)
cd $PVCDIR

SIZE=$(cat volume.meta | jq '.Size')

docker run --name longhorn -v /dev:/host/dev -v /proc:/host/proc -v /var/lib/longhorn/replicas/$PVCDIR:/volume --privileged -d longhornio/longhorn-engine:v1.7.1 launch-simple-longhorn $PVC $SIZE

mkdir /tmp/$PVCNAME
echo "Waiting for the PVC to be mounted"
sleep 10
mount /dev/longhorn/$PVC /tmp/$PVCNAME
cd /tmp/$PVCNAME
sleep 10
tar czvf ../${PWD##*/}.tar.gz .
cd /tmp

umount /tmp/$PVCNAME

docker stop longhorn
docker remove longhorn

echo "Done with PVC $PVCNAME"
```

## On new server
1. Install the application with the same settings as on the old server but different url
2. Visit Applications site to check if it works
3. Scale the application down to 0. This can be done with ```kubectl scale --replicas=0 deployment my-deployment-name -n my-namespace```
5. Attach PVCs to the server via Longhorn UI

Hint: I'm not sure if the following works when k3s is scaled down. With the last try i needed to connect the PVC to the host via the Longhorn UI.

1. Get all PVC ids with ```kubecctl get pvc -A```
2. Shutdown k3s with ```service k3s stop``` or scale down all deployment of the namespace with ```kubectl scale --replicas=0 deployment my-deployment-name -n my-namespace```
3. Execute the script with ```bash migrate.sh my-pv-id my-pvc-name```

````bash
#!/bin/bash

# Take in parameters
PVC="$1"
PVCNAME="$2"

if [[ -z "$PVC" || -z "$PVCNAME" ]]; then
    echo "Execute the file with: bash migrate.sh my-pv-id my-pvc-name"
fi

echo "Working with PVC $PVC having the name '$PVCNAME'"

if ! (command -v docker >/dev/null 2>&1 && command -v jq >/dev/null 2>&1); then
    echo "Docker or jq is not installed."
fi

cd /var/lib/longhorn/replicas
PVCDIR=$(find "/var/lib/longhorn/replicas" -type d -name "${PVC}*" -exec basename {} \;)
cd $PVCDIR

SIZE=$(cat volume.meta | jq '.Size')

docker run --name longhorn -v /dev:/host/dev -v /proc:/host/proc -v /var/lib/longhorn/replicas/$PVCDIR:/volume --privileged -d longhornio/longhorn-engine:v1.7.1 launch-simple-longhorn $PVC $SIZE
sleep 30

mkdir /tmp/$PVCNAME
mount /dev/longhorn/$PVC /tmp/$PVCNAME || exit 1
cd /tmp/$PVCNAME
echo -e "\033[0;33mThe following command will complain about not being able to delete . and .. this is normal\033[0m"

rm -Rf * .*
tar xpf "../${PVCNAME}.tar.gz" --same-owner
cd /tmp

umount /tmp/$PVCNAME

docker stop longhorn
docker remove longhorn

echo "Done with PVC $PVCNAME"
```

5. Scale all services up or start k3s again.
