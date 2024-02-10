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

Or you use this script to do it automatically
```
#!/bin/bash

# call with: bash pvc-export.sh my-pvc-id my-pvc-name

# Take in parameters
PVC="$1"
PVCNAME="$2"

echo "Working with PVC $PVC having the name '$PVCNAME'"

cd /mnt/longhorn-storage/replicas
PVCDIR=$(find "/mnt/longhorn-storage/replicas" -type d -name "${PVC}*" -exec basename {} \;)
cd $PVCDIR

SIZE=$(cat volume.meta | jq '.Size')

docker run --name longhorn -v /dev:/host/dev -v /proc:/host/proc -v /mnt/longhorn-storage/replicas/$PVCDIR:/volume --privileged -d longhornio/longhorn-engine:v1.3.0 launch-simple-longhorn $PVC $SIZE

mkdir /tmp/$PVCNAME
sleep 2
mount /dev/longhorn/$PVC /tmp/$PVCNAME
cd /tmp/$PVCNAME
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
6. Create a folder in tmp for mounting, it should be explainable like mount-gitlab-30gb
7. Mount all PVCs with ```mount /dev/longhorn/pvc-name /tmp/mount-gitlab-30gb/```
8. Go in the folder with ```cd mount-gitlab-30gb```
9. Delete all files with ```rm -Rf * .*```
10. Uncompress files with ```tar xpf  ../mount-gitlab-30gb.tar.gz --same-owner```
11. Unmount the folders with ```ùmount /tmp/mount-gitlab-30gb```
12. Detach volumes via Longhorn UI
13. Change DNS entry to point to new server
14. Scale application up again

### Or
1. Get all PVC ids with ```kubecctl get pvc -A```
2. Shutdown k3s with ```service k3s stop``` or scale down all deployment of the namespace with ```kubectl scale --replicas=0 deployment my-deployment-name -n my-namespace```
3. Execute the script with ```bash migrate.sh my-pvc-id my-pvc-name```

````bash
#!/bin/bash

# Take in parameters
PVC="$1"
PVCNAME="$2"

if [[ -z "$PVC" || -z "$PVCNAME" ]]; then
    echo "Execute the file with: bash migrate.sh my-pvc-id my-pvc-name"
fi

echo "Working with PVC $PVC having the name '$PVCNAME'"

if ! (command -v docker >/dev/null 2>&1 && command -v jq >/dev/null 2>&1); then
    echo "Docker or jq is not installed."
fi

cd /var/lib/longhorn/replicas
PVCDIR=$(find "/var/lib/longhorn/replicas" -type d -name "${PVC}*" -exec basename {} \;)
cd $PVCDIR

SIZE=$(cat volume.meta | jq '.Size')

docker run --name longhorn -v /dev:/host/dev -v /proc:/host/proc -v /var/lib/longhorn/replicas/$PVCDIR:/volume --privileged -d longhornio/longhorn-engine:v1.4.0 launch-simple-longhorn $PVC $SIZE
sleep 30

mkdir /tmp/$PVCNAME
mount /dev/longhorn/$PVC /tmp/$PVCNAME
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
