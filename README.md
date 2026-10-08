# k8s-monitoring-monorepo

# Kubernetes Monitoring & Autoscaling Monorepo

A Node.js microservices monorepo demonstrating Redis queue job processing, Prometheus metrics collection, and horizontal pod autoscaling (HPA) inside a local Minikube Kubernetes cluster.

## Architecture Overview

- Service A (API Gateway / Job Submitter): Receives job requests and places them onto a Redis queue.
- Service B (Worker): Consumes jobs from Redis, executes CPU-bound operations, and exports custom Prometheus processing metrics.
- Service C (Stats / Aggregator): Monitors Redis queue state and exports metrics for Prometheus scraping.
- Redis: In-memory datastore acting as the asynchronous job queue.
- Prometheus & Grafana: Scraping and visualization stack installed via Helm.

## Repository Structure

## Kubernetes & Minikube Deployment Guide

# 1. Cluster Setup

```bash
minikube start --cpus=4 --memory=6144
minikube addons enable ingress
minikube addons enable metrics-server
```

---

# 2. Environment Configuration

```bash
kubectl create configmap app-config --from-env-file=.env -n monitoring-app
```

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

```bash
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

# restart deployment

```bash
kubectl rollout restart deployment service-a -n monitoring-app
kubectl rollout restart deployment service-b -n monitoring-app
kubectl rollout restart deployment service-c -n monitoring-app
```

---

# 6. Verification & Monitoring

```bash
kubectl get pods -n monitoring-app

kubectl get configmap app-config -n monitoring-app

kubectl describe pod -l app=service-a -n monitoring-app

kubectl get secret --namespace monitoring prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 -d ; echo

kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring
```

---

# Port-Forward Services

```bash
kubectl port-forward svc/service-a 3000:3000 -n monitoring-app
kubectl port-forward svc/service-b 3001:3001 -n monitoring-app
kubectl port-forward svc/service-c 3002:3002 -n monitoring-app
```

---

# 7. Cleanup & Teardown

# Step 1: Stop Active Processes

# Press `Ctrl + C` in active terminals running `minikube tunnel` or `kubectl port-forward`.

# Step 2: Delete Kubernetes Resources

```bash
kubectl delete -f k8s/monitoring/
kubectl delete -f k8s/ingress/
kubectl delete -f k8s/service-c/
kubectl delete -f k8s/service-b/
kubectl delete -f k8s/service-a/
kubectl delete -f k8s/redis/
kubectl delete -f k8s/namespace/
```

# Step 3: Remove Helm Stack

```bash
helm uninstall prometheus --namespace monitoring
kubectl delete namespace monitoring
```

# Step 4: Stop or Delete Minikube

# Pause Cluster (Save State)

```bash
minikube stop
```

# Wipe Cluster (Free Disk Space)

```bash
minikube delete
```
