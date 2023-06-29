# Setup Backups
In this tutorial we will configure automatic backups for a K3s cluster with Longhorn using Velero to backup resources to an S3 storage.

Hint: Longhorn has a backup feature for the volumes included, but when the whole cluster is lost, the backups do not seem to be restoreable.

## Install Velero

Set up the Velero client by executing the following commands. Adapt the version number that might have [changed](https://github.com/vmware-tanzu/velero/releases).

```
mkdir -p ~/kube/config
cp /etc/rancher/k3s/k3s.yaml ~/kube/config

wget https://github.com/vmware-tanzu/velero/releases/download/v1.9.6/velero-v1.9.6-linux-amd64.tar.gz -O velero.tar.gz
tar -xvf velero.tar.gz
cp velero-v1.9.6-linux-amd64/velero /usr/local/bin
```

Install Velero server by creating a values.yml file with the following content:

```yaml
deployNodeAgent: true
snapshotsEnabled: false
initContainers:
  - name: velero-plugin-for-aws
    image: velero/velero-plugin-for-aws:v1.6.1
    volumeMounts:
      - mountPath: /target
        name: plugins
configuration:
  backupStorageLocation:
    - provider: aws
      bucket: my-bucket                          # <-- change
      default: true
      config:
        region: eu-west-1
        s3ForcePathStyle: true
        s3Url: https://my-bucket-endpoint        # <-- change
credentials:
  secretContents:
    cloud: |
      [default]
      aws_access_key_id: my-bucket-key           # <-- change
      aws_secret_access_key: my-bucket-secret    # <-- change
```

Run this command to set it up. Leave the namespace to "velero".
```
helm repo add vmware-tanzu https://vmware-tanzu.github.io/helm-charts/
helm upgrade --install velero vmware-tanzu/velero -f values.yml -n velero --create-namespace
```

Congratulations, you have successfully set up Velero!

## Testing Velero

To test Velero, an example deployment is included in the downloaded Velero client folder we deploy for testing:

```
kubectl apply -f velero-v1.9.6-linux-amd64/examples/nginx-app/with-pv.yaml
kubectl delete service my-nginx -n nginx-example
```

Check deployment success with ```kubectl get deployments --namespace=nginx-example```

Create a file in a mounted folder to verify later restoring worked by executing:
```
kubectl exec -n nginx-example deploy/nginx-deployment -- bash -c "echo Hello World > /var/log/nginx/test.txt"
kubectl exec -n nginx-example deploy/nginx-deployment -- bash -c "cat /var/log/nginx/test.txt"
```

Now let's create a **backup**:
```
velero backup create nginx-backup --include-namespaces nginx-example --default-volumes-to-fs-backup --wait
```

Let's simulate a disaster by deleting the namespace: 
```
kubectl delete namespace nginx-example
```

The namespace with its resources can be restored with
```
velero restore create --from-backup nginx-backup --wait
```

After nginx started up, you can validate the success by checking if the file test.txt exists with:
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
It's a daily backup at 1 am being saved for one week and a weekly backup saved for a month.

With these backups, you can restore the whole cluster or single namespaces using
```
velero restore create --from-backup daily-full-backup --include-namespaces my-namepsace
```

If you want to monitor your backups, you can use [BotKube](https://docs.botkube.io) or [Grafana](https://www.qloudx.com/monitoring-velero-kubernetes-backups-automated-alerting-for-backup-failures/).

## References
* Helm chart install details: https://artifacthub.io/packages/helm/vmware-tanzu/velero?modal=values&path=kubectl
* Velero file backup instructions https://velero.io/docs/main/file-system-backup/#to-back-up
