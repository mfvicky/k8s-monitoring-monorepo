# k8s-monitoring-monorepo

# Kubernetes Monitoring & Autoscaling Monorepo

A Node.js microservices monorepo demonstrating Redis queue job processing, Prometheus metrics collection, and horizontal pod autoscaling (HPA) inside a local Minikube Kubernetes cluster.

## Architecture Overview

- **Service A (API Gateway / Job Submitter)**: Receives job requests and places them onto a Redis queue.
- **Service B (Worker)**: Consumes jobs from Redis, executes CPU-bound operations, and exports custom Prometheus processing metrics.
- **Service C (Stats / Aggregator)**: Monitors Redis queue state and exports metrics for Prometheus scraping.
- **Redis**: In-memory datastore acting as the asynchronous job queue.
- **Prometheus & Grafana**: Scraping and visualization stack installed via Helm.

---

## Repository File Structure & Component Paths

### 1. Node.js Source Code

- **Service A (REST API + Redis Producer)**:
  - _Path_: `services/service-a/src/` (Main entry point / controller logic handling `/submit` and `/status/:id` requests and publishing to Redis).
- **Service B (Worker + Redis Consumer + Prometheus Metrics)**:
  - _Path_: `services/service-b/src/` (Worker process handling CPU-intensive workloads, consuming from Redis, and exposing `/metrics`).
- **Service C (Stats Aggregator + Prometheus Metrics)**:
  - _Path_: `services/service-c/src/` (Aggregator service tracking queue states and metrics).

### 2. Kubernetes YAML Manifests

- **Namespace & Configuration**:
  - _Path_: `k8s/namespace/` (Namespace creation)
  - _Path_: `k8s/configmap.yaml` (Shared environment and application configuration)
- **Core Microservices & Infrastructure**:
  - _Path_: `k8s/redis/` (Redis StatefulSet and Service manifests)
  - _Path_: `k8s/service-a/` (Service A Deployment, Service, and HPA manifests)
  - _Path_: `k8s/service-b/` (Service B Deployment, Service, and HPA manifests configured for 2–10 pods at >70% CPU)
  - _Path_: `k8s/service-c/` (Service C Deployment and Service manifests)
  - _Path_: `k8s/ingress/` (NGINX Ingress routing rules for gateway access)

### 3. Monitoring & Observability Setup

- **Prometheus Scrape Configuration / ServiceMonitors**:
  - _Path_: Configured via Helm chart values or custom ServiceMonitor resources located in `k8s/monitoring/` targeting Services B and C metrics endpoints.
- **Grafana Dashboards**:
  - _Path_: Provisioned via Helm (`kube-prometheus-stack` in the `monitoring-app` namespace) with pre-configured Kubernetes compute resource and pod monitoring JSON dashboards accessed at `http://localhost:3003`.

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

# How to run stress test

# 6. Verification, Stress Testing & Monitoring

# 1. Networking & Tunneling (Windows Resolution)

```bash
minikube tunnel
```

# 2. Port-Forward Services

```bash
kubectl port-forward svc/service-a-svc 3000:3000 -n monitoring-app
kubectl port-forward svc/service-b-svc 3001:3001 -n monitoring-app
kubectl port-forward svc/service-c-svc 3002:3002 -n monitoring-app
```

# 3. Run the Stress Test

```bash
ab -n 5000 -c 200 -p data.json -T "application/json" http://127.0.0.1/submit
```

# 4. Monitor HPA Autoscaling

```bash
kubectl get hpa service-b-hpa -n monitoring-app --watch
```

# for pods

```bash
kubectl get pods -n monitoring-app -l app=service-b --watch
```

# 5. Access Grafana Dashboard

```bash
kubectl get secret --namespace monitoring-app prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 -d ; echo
```

# Port-forward Grafana to port 3003:

```bash
kubectl --namespace monitoring-app port-forward svc/monitoring-grafana 3003:80
# kubectl port-forward svc/monitoring-grafana 3003:80 -n monitoring-app
```

# Screenshots of Grafana dashboards during stress test

# docs folder

# CPU Utilisation & Usage graph here showing spikes over 70%

docs\screenshots\before-grafana-cpu-n-graph.png
docs\screenshots\during-grafana-stress-testing-cpu-n-graph.png

# Pod Replicas scaling from 2 to 8+ here

docs\screenshots\HPA-console.png
docs\screenshots\PODS-grafana.png
---

# Observations on Scaling

# - Baseline State: Under normal idle conditions, service-b runs at the minimum configured floor of 2 replicas, maintaining minimal CPU utilization (<10%).

# - Load Impact: When Apache Bench fires 5,000 requests with a concurrency of 200 (-n 5000 -c 200), Service A quickly enqueues jobs into Redis, which Service B worker pods pick up and process concurrently.

# - HPA Reaction: As CPU consumption spikes well past the target threshold of 70%, the Kubernetes HPA controller automatically increases the pod replica count dynamically up to 8+ pods to handle the processing load.

# - Cool-Down: Once the stress test completes and the Redis queue drains back to zero, CPU usage drops, and the HPA scales the replicas back down toward the minimum baseline.

---

# General Diagnostics

```bash
kubectl get pods -n monitoring-app
kubectl get jobs -n monitoring-app
kubectl describe pod -l app=service-a -n monitoring-app
kubectl get ingress -n monitoring-app
kubectl get pods -n ingress-nginx
```

# Redis CLI Inspection

```bash
kubectl exec -it redis-68c7b9584d-9rgfv -n monitoring-app -- redis-cli

# Inside redis-cli:
LLEN job_queue
LRANGE job_queue 0 5
KEYS job:*
HGETALL job:<your-job-id>
```

# Cleanup & Teardown

# Step 1: Stop Active Processes

# Press Ctrl + C in active terminals running

# minikube tunnel, kubectl port-forward, or kubectl get hpa --watch.

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
helm uninstall monitoring -n monitoring-app
kubectl delete namespace monitoring-app
```

# Step 4: Stop or Delete Minikube

```bash
minikube stop
```

# Wipe Cluster (Free Disk Space)

```bash
minikube delete
```
