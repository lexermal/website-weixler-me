# abc




## Setup Rancher with the following tutorial
https://docs.technotim.live/posts/rancher-ha-install/
https://www.youtube.com/watch?v=APsZJbnluXg

## Setup Longhorn

 sudo apt install bash curl grep gawk open-iscsi nfs-common -y

 Inspired by
 https://www.youtube.com/watch?v=eKBBHc0t7bc
https://docs.technotim.live/posts/longhorn-install/

Install Longhorn with the following commands:

kubectl create namespace longhorn-system
helm install longhorn ./longhorn/chart/ --namespace longhorn-system
kubectl -n longhorn-system get pod

Open longhorn over the UI interface of Rancher by choosing the cluster and then is on the left side "Longhorn". Open the webinterface.

The UI should look like this:
![Longhorn UI](/longhorn.png)

As you can see there are multiple nodes in this cluster. Some have not much space but large computing power. Theses hosts should not save any data columes of longhorn at their disk.

This can be disabled by navigating to *Node*, clicking on edit at that nodes and disabling the *scheduling*.


## Adding custom helm charts
Navigate to https://artifacthub.io/
Search for a package you like.
Click on

| Names        | URLs           |
| ------------- | ------------- |
| bitnami	| https://charts.bitnami.com          |
| gissilabs	| https://gissilabs.github.io/charts/ |
| gitlab	| http://charts.gitlab.io/ |
| k8s-at-home	| https://k8s-at-home.com/charts/ |
| minecraft-server-charts	| https://itzg.github.io/minecraft-server-charts/ |
| nextcloud	| https://nextcloud.github.io/helm/ |
| nicholaswilde	| https://nicholaswilde.github.io/helm-charts/ |
| Partners | https://git.rancher.io/partner-charts |
| prometheus | https://prometheus-community.github.io/helm-charts |
| Rancher | https://git.rancher.io/charts |
| RKE2	| https://git.rancher.io/rke2-charts |



## Making Traefik available to the internet
By default Traefik is exposed but only to the IP used at setting up the cluster. When the cluster communicates with its nodes over WireGuard, the exposed IP is the one set from WireGuard and that one is a private one(like 10.1.1.1).

To fix this open the Rancher UI, go under "Service Discovery". There find the entry named "traefik" and check what the IP of the target is.

If this one is a private one, click on "Edit YAML" on the right side of that entry.

Find the field "field.cattle.io/publicEndpoints" and add the public IP to the array.

## Temporarily access the dashboard of Traefik
Because of security reasons the dashboard of Traefik should not be exposed to the internet. By default, it's also configured that way.

But to make it easier to spin up services it can temporarily be made public by entering the following command on the master node:

```kubectl port-forward -n kube-system "$(kubectl get pods -n kube-system| grep '^traefik-' | awk '{print $1}')" 9000:9000 --address <your-public-ip>```

Now you can access the web interface with http://your-ip:9000/dashboard/


## Tutorial on how to deploy an application with traefik
https://traefik.io/blog/traefik-proxy-kubernetes-101/
Don't use the example to redirect traffic. Use the tutorial below
## Redirect http calls to https
https://stackoverflow.com/a/71989847/808723

## Make Traefik accessible publically behind basic auth

First generate a secret called
```echo "password" | htpasswd -i -n admin```
Save it as secret named "usersecret" in namespace kube-system.

Apply the other config files in folder traefik-config


## Kubectl cheat sheet
https://kubernetes.io/docs/reference/kubectl/cheatsheet/

## Kubernetes best practices
https://kubernetes.io/docs/concepts/configuration/overview/


## Namespace structure
Clustering of services

-----Family
neuhold_wohnung
weixler_cloud
weixler_minecraft

-----Personal
weixler_vaultwarden
weixler_wiki
test_weixler_languagetool
weixler_discord_bridge

-----University
fh_anki
fh_survey
weixler_notes

-----Prattes
sysbox_host_prattes

-----Public
weixler_website
weixler_mediumgram
weixler_blog


-----Shared Project Resources
weixler_mockups

-----Devops
cluster_ssh
cluster_basics
sysbox_proxy




# Todos fuer Cluster4
- Inpiration fuer Server von https://www.youtube.com/watch?v=IE5y2_S8S8U

- Add monitoring https://docs.technotim.live/posts/rancher-monitoring/

