# Migrate Applications to other cluster

## On old server
1. Upgrade the application to the newest version
2. Scale the application down to 0
3. Attach PVCs to the server via Longhorn UI
4. Create a folder in tmp for mounting, it should be explainable like mount-gitlab-data
5. Mount all PVCs with ```mount /dev/longhorn/pvc-name /tmp/just-created-dir/```
6. Compress ```tar czvf ../${PWD##*/}.tar.gz .```
7. Copy tared files to new server

## On new server
1. Install the application with the same settings as on the old server
2. Scale the application down to 0
3. Attach PVCs to the server via Longhorn UI
4. Create a folder in tmp for mounting, it should be explainable like mount-gitlab-data
5. Mount all PVCs with ```mount /dev/longhorn/pvc-name /tmp/just-created-dir/```
6. Go in the folder with ```cd just-created-folder```
7. Delete all files with ```rm -Rf * .*```
8. Uncompress files with ```tar xpf  ../my-tar-dir.tar.gz --same-owner```
9. Unmount the folders with ```ùmount just-created-folder```
10. Detach volumes via Longhorn UI
11. Change DNS entry to point to new server
12. Scale application up again

