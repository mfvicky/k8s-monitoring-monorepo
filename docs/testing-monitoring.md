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
