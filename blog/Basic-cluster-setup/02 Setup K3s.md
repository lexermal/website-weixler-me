# Setup of an always cheap Kubernetes cluster

Hello everyone!

Today I'm going to explain how to create a high available cheap Kubernetes cluster that is ready within minutes.

I've tried out countless methods, and now I believe this is the best one.


## Rent cheap servers
In order to make it easy to host a Kubernetes cluster that is production ready that is still cheap we will have two HA master VPS and multiple cheap worker VPS.

The master VPS should have the following specs at least:
* 20GB SSD storage (NVM storage would be best)
* 2 GB memory
* 1 core CPU

The most crutial part of the tutorial is the choice on the master VPS. They will have ETCD installed and need therefore very fast storage. This servers are there to be kept for multiple years.

The worker nodes should just be as powerful as you need them. They can be swapped out anytime. I recommend to wait for sales like summer sale, chrismas deals, black friday to buy the worker nodes.

Here are some pages offering cheap servers on a regular basis:
* https://www.hostingadvice.com/coupon/
* https://www.vserververgleich.com/
* [hosttest](https://www-hosttest-de.translate.goog/vergleich/vserver.html?_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=sv&_x_tr_pto=wapp) This page is sadly only available in german but with Google Translater it should work fine.

## Prepare server
Change the hostname to something easily rememberable:
```
sudo hostnamectl set-hostname my-host-123
```

## Setup K3s
First of we set up the first master node.

Install K3s with the following commands:
```
curl -sfL https://get.k3s.io | sh -s - server --cluster-init
```

K3s needs now some time to install. You can check the status with:

```kubectl get nodes```

When the output looks similar the master node is ready:

```bash
NAME    STATUS   ROLES                       AGE     VERSION
node1   Ready    control-plane,etcd,master   4m53s   v1.24.4+k3s1
```

In order for the order master node to join later we need to know the master access token. You can get it with the following command:

```cat /var/lib/rancher/k3s/server/token```


## Setup K3s on other nodes
Now we add the second master node.

Run the following command and adapt the hostname and use the access token from above.

```
curl -sfL https://get.k3s.io | sh -s - server --server https://ip-or-hostname-of-first-master-node:6443 -t my-master-access-token
```


After the installation you should see the following by executing ```kubectl get nodes```:

```bash
NAME    STATUS   ROLES                       AGE   VERSION
node2   Ready    control-plane,etcd,master   17s   v1.24.4+k3s1
node1   Ready    control-plane,etcd,master   21m   v1.24.4+k3s1
```

When booth have the status ready, your master nodes are ready.

If the node does wouldn't join check for errors on that node via ```journalctl -u k3s-agent```. When it shows a **401 Unauthorized** error at the end of the output, it might be that you have invisible characters around the installation command. You can check for these with [this tool](https://www.soscisurvey.de/tools/view-chars.php).

## Adding worker nodes
Try to split up the worker nodes to booth master nodes.

Add a worker to a master node by executing
```
curl -sfL https://get.k3s.io | K3S_URL=https://my-master-server:6443 K3S_TOKEN=my-master-token sh -
```

## Removing a node
When the cheap period of the v-server is over, or you want to have another server that has a better price to performance ratio you can remove a host the following way:

> :warning: Keep in mind depending on the load running in the cluster it might sometimes be recommendable to first add another node before removing one.

1. If you have Longhorn installed disable scheduling on that node over the web interface.
2. Wait a bit for Longhorn to move the volumes.
3. Next drain the host and remove it from the cluster:
```
 kubectl drain my-node --delete-emptydir-data --ignore-daemonsets
 kubectl delete node my-node
```

The cluster needs some time to restructure itself.


## Configure the usage of a private repository
If you want to use a private docker repository in your cluster execute the following commands on every node that runs pods:
```
mkdir /etc/rancher/k3s
nano /etc/rancher/k3s/repositories.yaml
```

Insert the following config for your private repository:
```
mirrors:
  registry.my-domain.com:    # <-- change
    endpoint:
      - "https://url-of-docker-restiry"    # <-- change 
configs:
  "registry.my-domain.com":    # <-- change
    auth:
      username: my-user       # <-- change
      password: my-password   # <-- change
```

## Setup firewall rules (needs to be adjusted)

THIS DOES CURRENTLY NOT WORK, LOCAL IPS NEED TO BE ALLOWED TOO

In order to shrink the surface of attacks we add the following firewall rules to secure the master nodes ```sudo crontab -e```. Adapt the ip to the nodes ips:

```
@reboot /usr/sbin/iptables -A INPUT -p tcp --dport 6443 -s 1.2.3.4 -j ACCEPT
@reboot /usr/sbin/iptables -A INPUT -p tcp --dport 6443 -j DROPDROP
@reboot /usr/sbin/iptables -A INPUT -p tcp --dport 10250 -s 1.2.3.4 -j ACCEPT
@reboot /usr/sbin/iptables -A INPUT -p tcp --dport 10250 -j DROPDROP
```

## References
* Rancher instructions on how to set up a HA K3s cluster: https://docs.k3s.io/installation/ha-embedded
* Rancher instructions on how to add worker nodes: https://docs.k3s.io/quick-start
* Source for K3s private repository configuration https://docs.k3s.io/installation/private-registry
