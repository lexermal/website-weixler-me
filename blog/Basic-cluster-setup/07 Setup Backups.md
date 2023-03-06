# Setup Backups
In this tutorial we will configure automatic Backups in a K3s Cluster with Longhorn using Velero to backup resources to an S3 storage.

Longhorn will handle the persistence volume backup and Velero the backup for all other resources.

Velero is also the tool to recover from desasters, so it triggers Longhorn to create backups.

## Setup Longhorn
First we are setting up Longhorn to be able to work together with Velero and to be able to export the backups to an S3 storage.
Make sure the Longhorn is at least version 1.4.0.

### First we install the snalshot controller:

Create a file called **kustomization.yaml** with this contend:

```
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: kube-system
resources:
- https://github.com/kubernetes-csi/external-snapshotter/client/config/crd/?ref=v5.0.1
- https://github.com/kubernetes-csi/external-snapshotter/deploy/kubernetes/snapshot-controller/?ref=v5.0.1
```

Deploy the controller:
```
kubectl config set-context --current --namespace=kube-system
kubectl apply -k .
```

### Configure Longhorn

First configure a bucket in the S3 platform you want to use. I recommend https://idrivee2.com/ they are currently the cheapest on the market.

When you have the endpoint, access key and secret encode them by using this command ```echo -n my-endpoint-or-access-key-or-access-secret | base64```

Then create the file **s3-backup-secret.yml** with the following contend:

```
apiVersion: v1
kind: Secret
metadata:
  name: minio-secret
  namespace: longhorn-system
type: Opaque
data:
  AWS_ACCESS_KEY_ID: my-encoded-key      # <-- change
  AWS_SECRET_ACCESS_KEY: my-encoded-secret      # <-- change
  AWS_ENDPOINTS: my-encoded-endoint      # <-- change
```

Apply the file with ```kubectl apply -f k3-backup-secret.yml```

Open the settings of Longhorn and set the following:
* Backup Target: s3://my-bucket@my-endpoint.com/  **DON'T forget the /**
* Backup Target Credential Secret: s3-backup-secret

Safe the settings and trigger your first backup by checking all volumes and clicking "Create backup". 
You can see the progress in the backup tab.

### Create jobs for Snapshots and backups

Create a file called **longhorn-snapshot-vsc.yml** with the following contend:
```
kind: VolumeSnapshotClass
apiVersion: snapshot.storage.k8s.io/v1
metadata:
  name: longhorn-snapshot-vsc
driver: driver.longhorn.io
deletionPolicy: Delete
parameters:
  type: snap
```

Create a file called **longhorn-backup-vsc.yml** with the following contend:
```
kind: VolumeSnapshotClass
apiVersion: snapshot.storage.k8s.io/v1
metadata:
  name: longhorn-backup-vsc
driver: driver.longhorn.io
deletionPolicy: Delete
parameters:
  type: bak
```

kubectl apply -f longhorn-backup-vsc.yml -f longhorn-snapshot-vsc.yml


## Install Velero

Setup the velero client by executing the following commands. Adapt the version number might have changed see [here}(https://github.com/vmware-tanzu/velero/releases).

```
cp /etc/rancher/k3s/k3s.yaml ~/kube/config

wget https://github.com/vmware-tanzu/velero/releases/download/v1.9.6/velero-v1.9.6-linux-amd64.tar.gz -O velero.tar.gz
tar -xvf velero.tar.gz
cp velero-v1.9.6-linux-amd64/velero /usr/local/bin
```

Install velero server by creating a values.yml file with the following contend:

```yaml
# AWS backend and CSI plugins configuration
initContainers:
  - name: velero-plugin-for-aws
    image: velero/velero-plugin-for-aws:v1.3.0
    imagePullPolicy: IfNotPresent
    volumeMounts:
      - mountPath: /target
        name: plugins
  - name: velero-plugin-for-csi
    image: velero/velero-plugin-for-csi:v0.3.1
    imagePullPolicy: IfNotPresent
    volumeMounts:
      - mountPath: /target
        name: plugins
configuration:
  provider: aws
  backupStorageLocation:
    provider: aws
    bucket: my-bucket    # <-- change
    config:
      region: eu-west-1
      s3ForcePathStyle: true
      s3Url: my-bucket-url     # <-- change
  features: EnableCSI
credentials:
  secretContents:
    cloud: |
      [default]
      aws_access_key_id: my-bucket-key     # <-- change
      aws_secret_access_key: my-bucket-secret     # <-- change
```

Run this command to set it up. Leave the namespace to velero.
```
helm upgrade --install velero vmware-tanzu/velero -f values.yml -n velero --create-namespace
```

Wait till the pods are running.

Now a file called **volume-vsc.yml** which Velero uses to create VolumeSnapshot objects when orchestrating backups needs to be created with the following contend:

```
kind: VolumeSnapshotClass
apiVersion: snapshot.storage.k8s.io/v1
metadata:
  name: velero-longhorn-backup-vsc
  labels:
    velero.io/csi-volumesnapshot-class: "true"
driver: driver.longhorn.io
deletionPolicy: Retain
parameters:
  type: bak
```

Apply the file with ```kubectl apply -f volume-vsc.yml```

Congratulations, you have successfully setup Velero!

## Testing Velero

Let's check out if Velero works by setting up an example nginx server. An example deployment is included in the Velero client and can be setup with
```
kubectl apply -f velero-v1.9.6-linux-amd64/examples/nginx-app/with-pv.yaml
```

Check deployment success with ```kubectl get deployments --namespace=nginx-example```

Now we create a file in a mounted folder to verify later restoring worked. To do that execute:
```
kubectl exec -n nginx-example deploy/nginx-deployment -- bash -c "echo Hello World > /var/log/nginx/test.txt"
kubectl exec -n nginx-example deploy/nginx-deployment -- bash -c "cat /var/log/nginx/test.txt"
```

Now lets create a backup:
```
velero backup create nginx-backup --include-namespaces nginx-example --wait 
```

Let's simulate a desaster by deleting the namespace: ```kubectl delete namespace nginx-example```
With ```kubectl get namespace/nginx-example``` you can see the namespace with all iits resources does not exist anymore.

It can be restored with
```
velero restore create --from-backup nginx-backup --wait
```

After nginx started up you can validate the success by checking if the file test.txt exists with:
```
kubectl exec -n nginx-example deploy/nginx-deployment -- bash -c "cat /var/log/nginx/test.txt"
```
You will see it reads out "Hello World".

Ok, lets clean up with the following commands:
```
velero backup delete nginx-backup --confirm
kubectl delete namespace nginx-example
```

## Configure scheduled backups
For scheduling backups are many options on what to include, when to schedule it and how long it should be stored. 
I recommend the following as basis:
```
velero schedule create daily-full-backup --schedule="0 1 * * *" --ttl 168h0m0s
velero create schedule weekly-full-backup --schedule="@every 168h" --ttl 720h0m0s
```
It's a daily backup at 1am being saved for one week and a weekly backup saved for a month.

With these backups you can restore the whole cluster or single namespaces using
```
velero restore create --from-backup daily-full-backup --include-namespaces my-namepsace
```

If you want to monitor your backups, you can use [BotKube](https://docs.botkube.io) or [Grafana](https://www.qloudx.com/monitoring-velero-kubernetes-backups-automated-alerting-for-backup-failures/).

## Refernces
* Wonderful setup for Raspberry PI cluster setup, tutorial is inspired by it https://picluster.ricsanfre.com/docs/backup/#enable-csi-snapshots-support-in-k3s
* Helm chart install details: https://artifacthub.io/packages/helm/vmware-tanzu/velero?modal=values&path=kubectl

