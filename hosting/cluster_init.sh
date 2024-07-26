#!/bin/bash

# After a cluster got provisioned this script should be executed on the admins machine.

# Requirements:
# - The cluster got installed with "local deployment" being disabled.
# - The script gets exectured in a directory in which Kubernetes deployment files can be created.

if ! command -v helm &> /dev/null; then
    echo "Helm is not installed. It is required to proceed."
    echo "It can be installed with: curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash"
    exit 1
fi

# Check if `kubectl get pods` command fails
if ! kubectl get pods &> /dev/null; then
    echo "Failed to check if kubectl can access a cluster. Ensure that kubectl is installed and configured to access the target cluster."
    exit 1
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


# Install cert-manager
helm repo add jetstack https://charts.jetstack.io
helm upgrade -i cert-manager jetstack/cert-manager -n cert-manager --create-namespace --set installCRDs=true 

waitForAllPods cert-manager

# Setup cert-manager

helm repo add piccobit https://piccobit.github.io/helm-charts
helm install -n cert-manager cm-hosttech piccobit/cert-manager-webhook-hosttech --set groupName=acme.sumdays.org


mkdir -p ./cluster/cert-manager
cd ./cluster/cert-manager

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

# Enhance Traefik
cd ..
mkdir -p ./traefik
cd traefik

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
helm install longhorn longhorn/longhorn -n longhorn-system --create-namespace

waitForAllPods longhorn-system

echo ""
echo -e "\033[0;32mThe cluster is initialized.\033[0m"
echo ""
