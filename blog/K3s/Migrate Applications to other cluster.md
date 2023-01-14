# Migrate Applications to other cluster

## On old server
1. Upgrade the application to the newest version
2. Scale the application down to 0
3. Attach PVCs to the server via Longhorn UI
4. Create a folder in tmp for mounting, it should be explainable like the application name and PVC size e.g. mount-gitlab-30gb
5. Mount all PVCs with ```mount /dev/longhorn/pvc-name /tmp/mount-gitlab-30gb/```
6. Compress ```tar czvf ../${PWD##*/}.tar.gz .```
7. Copy tared files to new server

## On new server
1. Install the application with the same settings as on the old server
2. Scale the application down to 0
3. Attach PVCs to the server via Longhorn UI
4. Create a folder in tmp for mounting, it should be explainable like mount-gitlab-30gb
5. Mount all PVCs with ```mount /dev/longhorn/pvc-name /tmp/mount-gitlab-30gb/```
6. Go in the folder with ```cd mount-gitlab-30gb```
7. Delete all files with ```rm -Rf * .*```
8. Uncompress files with ```tar xpf  ../mount-gitlab-30gb.tar.gz --same-owner```
9. Unmount the folders with ```ùmount /tmp/mount-gitlab-30gb```
10. Detach volumes via Longhorn UI
11. Change DNS entry to point to new server
12. Scale application up again

