# Setup Longhorn
Execute the following commands on all nodes.
```
sudo apt install bash curl grep gawk open-iscsi nfs-common -y
sudo systemctl enable open-iscsi --now
```

Install Longhorn with the following commands:

```
kubectl apply -f https://raw.githubusercontent.com/longhorn/longhorn/master/deploy/longhorn.yaml
```

Watch how it installs
```
kubectl get pods --namespace longhorn-system --watch
```

Open longhorn over the UI interface of Rancher by choosing the cluster and then is on the left side "Longhorn". Open the webinterface.

There are multiple nodes in this cluster. Some have not much space but large computing power. These hosts should not save any data colums of longhorn at their disk.

This can be disabled by navigating to *Node*, clicking on edit at that nodes and disabling the *scheduling*.

### Fix Longhorn default storage class error

When you install Longhorn it is by default set to be the default storage class, but local-path is so too.

Therefore, it is required to deactivate local-path from being a default storage class.

Run the following commands
```
cd /var/lib/rancher/k3s/server/manifests
cp local-storage.yaml custom-local-storage.yaml
nano custom-local-storage.yaml
```
At around line 90 change ```storageclass.kubernetes.io/is-default-class: "true"``` to ```storageclass.kubernetes.io/is-default-class: "false"```.

Adapt the file **/etc/systemd/system/k3s.service**, so it looks at the end like this:
```
ExecStart=/usr/local/bin/k3s \
    server \
        '--cluster-init' \
        '--disable=local-storage'
```

Restart the node and the storage is fixed.

## Troubleshoot multipath issue

If you find in your logs issues like these
```time="2020-04-16T08:49:27Z" level=info msg="GRPC request: {\"target_path\":\"/var/lib/kubelet/pods/cf0a0b5b-106e-4793-a74a-28bfae21be1a/volumes/kubernetes.io~csi/pvc-d061512e-870a-4ece-bd45-2f04672d5256/mount\",\"volume_capability\":{\"AccessType\":{\"Mount\":{\"fs_type\":\"ext4\"}},\"access_mode\":{\"mode\":1}},\"volume_context\":{\"baseImage\":\"\",\"fromBackup\":\"\",\"numberOfReplicas\":\"3\",\"staleReplicaTimeout\":\"30\",\"storage.kubernetes.io/csiProvisionerIdentity\":\"1586958032802-8081-driver.longhorn.io\"},\"volume_id\":\"pvc-d061512e-870a-4ece-bd45-2f04672d5256\"}"
time="2020-04-16T08:49:27Z" level=info msg="NodeServer NodePublishVolume req: volume_id:\"pvc-d061512e-870a-4ece-bd45-2f04672d5256\" target_path:\"/var/lib/kubelet/pods/cf0a0b5b-106e-4793-a74a-28bfae21be1a/volumes/kubernetes.io~csi/pvc-d061512e-870a-4ece-bd45-2f04672d5256/mount\" volume_capability:<mount:<fs_type:\"ext4\" > access_mode:<mode:SINGLE_NODE_WRITER > > volume_context:<key:\"baseImage\" value:\"\" > volume_context:<key:\"fromBackup\" value:\"\" > volume_context:<key:\"numberOfReplicas\" value:\"3\" > volume_context:<key:\"staleReplicaTimeout\" value:\"30\" > volume_context:<key:\"storage.kubernetes.io/csiProvisionerIdentity\" value:\"1586958032802-8081-driver.longhorn.io\" > "
E0416 08:49:27.567704 1 mount_linux.go:143] Mount failed: exit status 32
Mounting command: mount
Mounting arguments: -t ext4 -o defaults /dev/longhorn/pvc-d061512e-870a-4ece-bd45-2f04672d5256 /var/lib/kubelet/pods/cf0a0b5b-106e-4793-a74a-28bfae21be1a/volumes/kubernetes.io~csi/pvc-d061512e-870a-4ece-bd45-2f04672d5256/mount
Output: mount: /var/lib/kubelet/pods/cf0a0b5b-106e-4793-a74a-28bfae21be1a/volumes/kubernetes.io~csi/pvc-d061512e-870a-4ece-bd45-2f04672d5256/mount: /dev/longhorn/pvc-d061512e-870a-4ece-bd45-2f04672d5256 already mounted or mount point busy.
E0416 08:49:27.576477 1 mount_linux.go:487] format of disk "/dev/longhorn/pvc-d061512e-870a-4ece-bd45-2f04672d5256" failed: type:("ext4") target:("/var/lib/kubelet/pods/cf0a0b5b-106e-4793-a74a-28bfae21be1a/volumes/kubernetes.io~csi/pvc-d061512e-870a-4ece-bd45-2f04672d5256/mount") options:(["defaults"])error:(exit status 1)
time="2020-04-16T08:49:27Z" level=error msg="GRPC error: rpc error: code = Internal desc = exit status 1"
```

It's likely that you have a multipath issue. Detailed infos about the issue can be found in the references below.

To solve the issue edit the file ```/etc/multipath.conf``` on the node where the issues happen and insert the following lines at the end

```
blacklist {
    devnode "^sd[a-z0-9]+"
}
```

Apply changes with ```systemctl restart multipathd.service```.
You can validate the changes with ```multipath -t````.

Now mounting should work. Find the PVCs that do not work, detach them via Longhorn UI and attach them again on the node where the pod is running. Then delete the pod and it will start properly.


## Troubleshoot Attach and Detach loop
If it happends that the Longhorn UI shows that a PVC gets attached and seconds later detached in a loop the following helps.

The issue why the PVC does not get mounted is because the volume size does not match. You can find the error message in the **longhron-manager* pod
```
time="2022-11-17T16:24:02Z" level=warning msg="pvc-0646006d-ea7b-4dee-abed-6d6cde9a5137-e-3d30d9e2: time=\"2022-11-17T15:05:54Z\" level=warning msg=\"backend tcp://10.42.1.101:10015 size does not match 5368709120 != 32212254720 in the engine initiation phase\""
```

You can fix this by first extracting the data from the volume, delete it and copy it into the new one.

First go into the directory of the volume:

```
cd /var/lib/longhorn/replicas/
cd <pvc-name>
```

Then you need to find out the size of the volume by reading it out of the file **volume.meta**.

Then run the following command to be able to mount the volume. Adjust the pvc and size before executing:
```
docker run -v /dev:/host/dev -v /proc:/host/proc -v /var/lib/longhorn/replicas/my-pvc-directory:/volume --privileged -d longhornio/longhorn-engine:v1.3.0 launch-simple-longhorn my-pvc-name my-found-size
```

Now you can mount the vollume with
```
mkdir /tmp/my-pvc-data
mount /dev/longhorn/my-pvc-name /tmp/my-pvc-data
```

Copy all data.
Stop the docker container.
Delete the PVC via Longhorn UI.
Scale the deployment of your pod down to 0, mount the new PCV and copy all data into it.
Scale the deployment up again.

## Troubleshoot "no relationship found between node 'X' and this object" error

```
MountVolume.WaitForAttach failed for volume \"pvc-84933541-a66d-4ca2-a710-6db17e6643ba\" : volume pvc-84933541-a66d-4ca2-a710-6db17e6643ba has GET error for volume attachment csi-0c400de43ff27c65fa12afab1248675317dbb2b8fc07ae6582df5ce218fa6ff7: volumeattachments.storage.k8s.io \"csi-0c400de43ff27c65fa12afab1248675317dbb2b8fc07ae6582df5ce218fa6ff7\" is forbidden: User \"system:node:server1\" cannot get resource \"volumeattachments\" in API group \"storage.k8s.io\" at the cluster scope: no relationship found between node 'server1' and this object
```

This is currently an open bug: https://github.com/longhorn/longhorn/issues/4188

It can be fixed by scaling the deployment down to 0 and back up:

```
kubectl scale --replicas=0 deployment my-deployment-name -n my-namespace
kubectl scale --replicas=1 deployment my-deployment-name -n my-namespace
```

## Troubleshoot read only file system
If you encounter an error in the pod logs that says the file system is read only, this is the solution.

Like in the troubleshooting point from above you simply need to scale the deployment to 0 and scale back up:
```
kubectl scale --replicas=0 deployment my-deployment-name -n my-namespace
kubectl scale --replicas=1 deployment my-deployment-name -n my-namespace
```


## References
* Explanation on how to disable local-path storage class https://bytemeta.vip/repo/k3s-io/k3s/issues/4083
* Tutorial on how to install Longhorn https://docs.technotim.live/posts/longhorn-install/
* Infos about Multiplatform issue https://longhorn.io/kb/troubleshooting-volume-with-multipath/
* Infos about attaching loop https://longhorn.io/docs/1.1.0/advanced-resources/data-recovery/export-from-replica/