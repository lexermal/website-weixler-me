# Setup of an always cheap Kubernetes cluster

Hello everyone!

Today I'm going to explain how to create a high available Kubernetes cluster that is up in a few minutes and is very cheap.
When having a small budget but still want to always get performant servers, this tutorial is exactly for you!

Let's assume you have multiple servers that are all available over the internet. This could be because you are testing out multiple hosting services or simply have multiple servers you want to connect to one cluster to keep the administration effort small.

## Rent cheap servers
First of you have to rent at least 2 v-servers. Cheap ones can be found on these pages. Generally I found out that servers in europe are way cheaper then in USA. You can also get very cheap servers at sales like summer sale, chrismas deals, black friday,...

https://www.hostingadvice.com/coupon/

https://www.vserververgleich.com/

[hosttest](https://www-hosttest-de.translate.goog/vergleich/vserver.html?_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=sv&_x_tr_pto=wapp) This page is sadly only available in german but with google translater it should work fine.



## Prepare everything for Setting up K3s
To have a secure cluster we want to use Wireguard for the communication.

Because to create a network with wireguard where every server can talk to each other it is very difficult to manage on our own. Thats why we use Netmaker. It takes care of the wireguard configuration and we simply need to join the nodes.

For that we setup Netmaker on a server that will be available permanently and it is separate from the Kubernetes cluster. This can be a server in your home network thats publically available or a cheap vserver. At least 2GB of memory are recommended.

Follow these instructions to set it up:
https://netmaker.readthedocs.io/en/master/getting-started.html

To understand how networker works, here is a great tutorial.
https://www.youtube.com/watch?v=NWMYPU2FCjI

When Netmaker is up and running, log into the dashboard.

Then create a network with the IP range 10.33.33.0/24 and the name "cluster-nw". You can use another range, but this works in most cases.

Then create access tokens for every node and copy the docker command.

Install docker on every node with

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh ./get-docker.sh
```

**Run it on every node but add "--restart always" at the end.**

You can see in the node view when nodes are connected successfully.


## Setup K3s
First of we set up the first master node.
For that we need the WireGuard interface IP. You find it with ```ip add```. It should be 10.33.33.1

Next we install K3s with the following commands:
```
wget https://get.k3s.io -O k3s-install.sh

sudo sh k3s-install.sh server --advertise-address 10.33.33.1 --flannel-iface=nm-cluster-nw1 --cluster-init
```

K3s needs now some time to install. In meantime we can get the access token for the other nodes by entering the following command:

```cat /var/lib/rancher/k3s/server/token```

Copy it somewhere for later usage.


Now K3s should be set up. We can check if everything worked by displaying the nodes:

```kubectl get nodes```

When the output looks similar to this everything worked:

```bash
NAME    STATUS   ROLES                       AGE     VERSION
node1   Ready    control-plane,etcd,master   4m53s   v1.24.4+k3s1
```
The node needs to have the status ready.



## Setup K3s on other nodes
Now we add the second master node. We use the same script but adjust the ip to the one of the previews node and set the access token we got from the other host.

```
wget https://get.k3s.io -O k3s-install.sh

sudo sh k3s-install.sh server --flannel-iface=nm-cluster-nw1 --server https://10.33.33.1:6443 -t my-access-token
```

Wait a minute for K3s to initialize on that node.

When you now execute ```kubectl get nodes``` you will see that the other node slowly joins:

```bash
NAME    STATUS   ROLES                       AGE   VERSION
node2   Ready    control-plane,etcd,master   17s   v1.24.4+k3s1
node1   Ready    control-plane,etcd,master   21m   v1.24.4+k3s1
```

When booth have the status ready, your cluster is initialized.

If the node does wount join check for errors on that node via ```journalctl -u k3s-agent```. When it shows a **401 Unauthorized** error at the end of the output, it might be that you have invisible characters around the install comand. You can check for these with [this tool](https://www.soscisurvey.de/tools/view-chars.php).

When adding multiple nodes try to connect the new one to the one that will stay the longest in the cluster.

## Removing a node
When the cheap period of the v-server is over or you want to have a other server that has a better price to performance ratio you can remove a host the following way:

> :warning: Keep in mind depending on the load running in the cluster it might sometimes be recommendable to first add another node before removing one.

To add a node simply follow the introductions from above.

If you have Longhorn installed disable scheduling on that node over the web interface.

Wait a bit for Longhorn to move the volumes.

Next drain the host and remove it from the cluster:
```
 kubectl drain my-node --delete-emptydir-data --ignore-daemonsets
 kubectl delete node my-node
```

The cluster needs now some time to restructure itself.

You are now done congratulations!!


You can now install your first Kubernetes services but I would recommend you to first [secure your nodes against attacks](DRAFT-Secure%20VPS.md) and make the cluster more [convinient to use](DRAFT-Prepare%20K3s%20cluster%20tools.md).



## References
* Rancher instructions on how to setup a HA K3s cluster: https://rancher.com/docs/k3s/latest/en/installation/ha-embedded/
