# Production Kubernetes Configuration

For development guidelines, refer to [Best Practices](../best-practices.md)

## Current status
- Single replica deployments
- Basic health checks
- No pod disruption budgets
- Simple rolling updates
- Potential downtime during deployments
- Services can be temporarily unavailable during startup

## Wanted status
- Zero-downtime deployments
- High availability for all services
- Proper resource management
- Graceful service handling
- Automatic recovery from failures
- Production-grade monitoring

## Implementation Steps

### 1. High Availability Setup
- [ ] Configure multiple replicas for each service
```yaml
spec:
  replicas: 3  # Minimum for production
```
- [ ] Implement pod disruption budgets
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: budget-api-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: budget-api-app
```
- [ ] Configure pod anti-affinity for spreading across nodes
```yaml
spec:
  affinity:
    podAntiAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
            - key: app
              operator: In
              values:
              - budget-api-app
          topologyKey: kubernetes.io/hostname
```

### 2. Resource Management
- [ ] Define resource requests and limits
```yaml
resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi
```
- [ ] Implement horizontal pod autoscaling
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: budget-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: budget-api-app
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 80
```

### 3. Improved Health Checks
- [ ] Enhanced readiness probes
```yaml
readinessProbe:
  httpGet:
    path: /health
    port: http
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 3
  successThreshold: 1
```
- [ ] Enhanced liveness probes
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: http
  initialDelaySeconds: 15
  periodSeconds: 10
  failureThreshold: 3
  timeoutSeconds: 5
```

### 4. Rolling Update Strategy
- [ ] Configure rolling update strategy
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
```
- [ ] Add preStop hooks for graceful shutdown
```yaml
lifecycle:
  preStop:
    exec:
      command: ["/bin/sh", "-c", "sleep 10"]
```

### 5. Network Policies
- [ ] Implement network policies for service isolation
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-network-policy
spec:
  podSelector:
    matchLabels:
      app: budget-api-app
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: budget-web-app
    ports:
    - protocol: TCP
      port: 4000
```

## First Milestone
1. Implement multiple replicas
2. Add pod disruption budgets
3. Configure proper resource limits
4. Enhance health checks
5. Test rolling updates

## Impact
- Zero-downtime deployments
- Better resource utilization
- Improved reliability
- Automatic scaling
- Better isolation between services

## Dependencies
- Kubernetes cluster with multiple nodes
- Resource monitoring setup
- Network policy support
- Horizontal Pod Autoscaling controller 