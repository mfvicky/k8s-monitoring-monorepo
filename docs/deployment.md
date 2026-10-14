## Kubernetes & Minikube Deployment Guide

# Steps to deploy on Minikube

### 1. Cluster Setup

````bash
minikube start --cpus=4 --memory=6144
minikube addons enable ingress
minikube addons enable metrics-server
minikube addons list | grep ingress

---

# 2. Environment Configuration

```bash
kubectl create configmap app-config --from-env-file=.env -n monitoring-app
kubectl get configmap app-config -n monitoring-app
````

---

# 3. Build & Load Container Images

Build Images

```bash
docker build -t service-a:1.0 -f services/service-a/Dockerfile .
docker build -t service-b:1.0 -f services/service-b/Dockerfile .
docker build -t service-c:1.0 -f services/service-c/Dockerfile .
```

# Load Images into Minikube

```bash
minikube image load service-a:1.0
minikube image load service-b:1.0
minikube image load service-c:1.0
```

# Verify Images

```bash
minikube image ls | grep service
```

---

# 4. Deploy Prometheus Monitoring Stack

# Install Helm (Windows)

```bash
winget install Helm.Helm
helm version
```

# Add Helm Repository & Install

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set alertmanager.enabled=false
```

---

# 5. Deploy Application Manifests

# 1. Create namespace first

```bash
kubectl apply -f k8s/namespace/
```

# 2. Create shared ConfigMap (referencing your file directly under k8s/)

kubectl get jobs -n monitoring-app

```bash
kubectl apply -f k8s/namespace/
kubectl apply -f k8s/configmap.yaml
```

# 3. Deploy Redis, Services, Ingress, and Monitoring

```bash
kubectl apply -f k8s/redis/
kubectl apply -f k8s/service-a/
kubectl apply -f k8s/service-b/
kubectl apply -f k8s/service-c/
kubectl apply -f k8s/ingress/
kubectl apply -f k8s/monitoring/

```

# Restart Deployments (if needed)

```bash
kubectl rollout restart deployment service-a -n monitoring-app
kubectl rollout restart deployment service-b -n monitoring-app
kubectl rollout restart deployment service-c -n monitoring-app
```

---
