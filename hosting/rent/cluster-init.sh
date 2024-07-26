#!/bin/bash

# This script is ment to be executed on the VPS which did not get provisioned with Harvester.

if [ "$EUID" -ne 0 ]
  then echo "Please run as root."
  exit
fi

waitForAllPods() {
  local namespace="$1"

  echo "Waiting for all pods in '${namespace}' to be running..."

  while true; do
    sleep 5
    # Count the pods that are not in Running status.
    non_running_pod_count=$(kubectl get pods -n "${namespace}" --no-headers | grep -v -E "Running|Completed" | wc -l)

    if [[ $non_running_pod_count -eq 0 ]]; then
      echo "All pods in '${namespace}' are running."
      return 0
    else
      echo "${non_running_pod_count} pods are not running. Checking again in 10 seconds..."
    fi

    sleep 5
  done
}

# Uninstall K3s if installed
if [[ -f "/usr/local/bin/k3s-uninstall.sh" ]]; then
    bash /usr/local/bin/k3s-uninstall.sh
fi

# Resolve multipath issue for Longhorn
# See https://longhorn.io/kb/troubleshooting-volume-with-multipath/
if grep -q "backlist" "/etc/multipath.conf"; then
    echo -e "\033[0;33mBacklist config found in /etc/multipath.conf, skipping configuration.\033[0m"
else
    echo "
blacklist {
    devnode "^sd[a-z0-9]+"
}
" >> /etc/multipath.conf
    systemctl restart multipathd.service
fi



# Install K3S
curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION=v1.27.15+k3s2 sh -s - server 

sleep 90

waitForAllPods kube-system

# Install cert-manager
curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash
helm repo add rancher-stable https://releases.rancher.com/server-charts/stable
helm repo add jetstack https://charts.jetstack.io
mkdir ~/.kube
cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
helm upgrade -i cert-manager jetstack/cert-manager -n cert-manager --create-namespace --set installCRDs=true 

waitForAllPods cert-manager

# Setup cert-manager

helm repo add piccobit https://piccobit.github.io/helm-charts
helm install -n cert-manager cm-hosttech piccobit/cert-manager-webhook-hosttech --set groupName=acme.sumdays.org


mkdir -p /k8s-deployments/cluster/cert-manager
cd /k8s-deployments/cluster/cert-manager

read -p "What is the Hosttech API key? " hosttechkey

echo "
apiVersion: v1
kind: Secret
metadata:
  name: hosttech-secret
  namespace: cert-manager
type: Opaque
stringData:
  token: $hosttechkey
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-production
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: dns@sumdays.org
    privateKeySecretRef:
      name: letsencrypt-production
    solvers:
      - dns01:
          webhook:
            groupName: acme.sumdays.org
            solverName: hosttech
            config:
              secretName: hosttech-secret
              apiUrl: https://api.ns1.hosttech.eu/api/user/v1 
" > certificate-config.yml

kubectl apply -f certificate-config.yml

waitForAllPods cert-manager

# Setup Rancher
read -p "On which domain should Rancher run? rancher.example.com? The hostname is $(hostname). " rancherdomain
read -p "What should be the admin password for Rancher? " rancherpassword

helm install rancher rancher-stable/rancher -n cattle-system \
  --create-namespace \
  --set replicas=1 \
  --set global.cattle.psp.enabled=false \
  --set hostname=$rancherdomain \
  --set bootstrapPassword=$rancherpassword \
  --set ingress.tls.source=secret \
  --set ingress.extraAnnotations.'cert-manager\.io/cluster-issuer'=letsencrypt-production

waitForAllPods cattle-system

# Enhance Traefik

mkdir -p /k8s-deployments/cluster/traefik
cd /k8s-deployments/cluster/traefik

echo "
apiVersion: helm.cattle.io/v1
kind: HelmChartConfig
metadata:
  name: traefik
  namespace: kube-system
spec:
  valuesContent: |-
    # enable https forwarding
    ports:
      websecure:
        tls:
          enabled: true
      web:
        redirectTo:
          port: websecure
    additionalArguments:
      - "--log.level=DEBUG"
" > traefik-enhancement.yml

kubectl apply -f traefik-enhancement.yml

# Install Longhorn
helm repo add longhorn https://charts.longhorn.io
helm install longhorn longhorn/longhorn -n longhorn-system --create-namespace --version 1.6.2

waitForAllPods longhorn-system

cd /var/lib/rancher/k3s/server/manifests
cp local-storage.yaml custom-local-storage.yaml
sudo sed -i -e "s/storageclass.kubernetes.io\/is-default-class: \"true\"/storageclass.kubernetes.io\/is-default-class: \"false\"/g" custom-local-storage.yaml

sed -i "/server \\\/a \    '--disable=local-storage'" /etc/systemd/system/k3s.service

# reboot in 5min
shutdown -r +5

echo ""
echo -e "\033[0;32mThe cluster is initialized. It will reboot in 5 minutes.\033[0m"
echo ""
