# k8s-monitoring-monorepo

# Kubernetes Monitoring & Autoscaling Monorepo

A Node.js microservices monorepo demonstrating Redis queue job processing, Prometheus metrics collection, and horizontal pod autoscaling (HPA) inside a local Minikube Kubernetes cluster.

docs\Kubernetes-Microservices-Monitoring.drawio

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
