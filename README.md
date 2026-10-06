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
