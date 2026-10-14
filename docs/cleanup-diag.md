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
