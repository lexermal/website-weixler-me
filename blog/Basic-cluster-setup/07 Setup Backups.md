# Setup Backups


## Setup Longhorn

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



## Refernces
* Wonderful setup for Raspberry PI cluster setup, tutorial is inspired by it https://picluster.ricsanfre.com/docs/backup/#enable-csi-snapshots-support-in-k3s
* Helm chart install details: https://artifacthub.io/packages/helm/vmware-tanzu/velero?modal=values&path=kubectl

