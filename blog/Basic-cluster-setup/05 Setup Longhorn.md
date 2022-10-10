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

Now we need to change the default class to longhorn. We do that by executing this command:
```
kubectl patch storageclass local-path -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"false"}}}'
```
We also need to add the following command to crontab so the storageclass gets set when the server reboots. We do that with ```crontab -e``` and pasting the following at the end of the file:
```
@reboot /usr/bin/sleep 200 && kubectl patch storageclass local-path -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"false"}}}'
```