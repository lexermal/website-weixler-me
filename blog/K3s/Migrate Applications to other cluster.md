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

## On new server
1. Install the application with the same settings as on the old server but different url
2. Visit Applications site to check if it works
3. Scale the application down to 0
4. Attach PVCs to the server via Longhorn UI
5. Create a folder in tmp for mounting, it should be explainable like mount-gitlab-30gb
6. Mount all PVCs with ```mount /dev/longhorn/pvc-name /tmp/mount-gitlab-30gb/```
7. Go in the folder with ```cd mount-gitlab-30gb```
8. Delete all files with ```rm -Rf * .*```
9. Uncompress files with ```tar xpf  ../mount-gitlab-30gb.tar.gz --same-owner```
10. Unmount the folders with ```ùmount /tmp/mount-gitlab-30gb```
11. Detach volumes via Longhorn UI
12. Change DNS entry to point to new server
13. Scale application up again

