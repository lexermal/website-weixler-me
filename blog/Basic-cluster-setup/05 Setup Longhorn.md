# Setup Longhorn
Execute the following commands on all nodes.
```
sudo apt install bash curl grep gawk open-iscsi nfs-common -y
sudo systemctl enable open-iscsi --now
```

 Inspired by
 https://www.youtube.com/watch?v=eKBBHc0t7bc
https://docs.technotim.live/posts/longhorn-install/

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

Adapt the file /etc/systemd/system/k3s.service, so it looks at the end like this:
```
ExecStart=/usr/local/bin/k3s \
    server \
        '--advertise-address' \
        '10.33.33.2' \
        '--flannel-iface=nm-cluster-nw1' \
        '--cluster-init' \
        '--disable=local-storage'
```

Restart the node and the storage is fixed.


## References
* Explanation on how to disable local-path storage class https://bytemeta.vip/repo/k3s-io/k3s/issues/4083
*