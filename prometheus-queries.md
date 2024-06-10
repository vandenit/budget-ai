### Step 2: Query Memory Usage in Prometheus

Now that your deployments are labeled, you can use these labels in your PromQL queries to filter for metrics related to your budget apps.

**Example Query for Memory Usage**:
To query the memory usage for only your budget apps, you can filter by the `app` label. Assuming `process_resident_memory_bytes` is the metric name for memory usage, the query would look like this:

```promql
process_resident_memory_bytes{app=~"budget-.*"}
```

This query uses a regular expression to match any value of the `app` label that starts with `budget-`.

### Step 3: Access Prometheus UI and Execute Query

1. **Access Prometheus UI**:
   If Prometheus is not exposed via a LoadBalancer or Ingress, use port forwarding to access the Prometheus UI locally.

   ```bash
   kubectl port-forward -n monitoring deployment/prometheus-server 9090:9090
   ```

   Open your browser and navigate to `http://localhost:9090`.

2. **Navigate to the "Graph" Tab**:
   Click on the "Graph" tab at the top.

3. **Enter the Query**:
   Enter the query `process_resident_memory_bytes{app=~"budget-.*"}` in the "Expression" input box.

4. **Execute the Query**:
   Click the "Execute" button to run the query. The results will be displayed below the input box.

5. **Visualize the Data**:
   Switch between the "Table" and "Graph" views to see the data in different formats.

### Example PromQL Queries

Here are a few additional PromQL queries you might find useful:

- **Total Resident Memory Usage for All Budget Apps**:

  ```promql
  sum(process_resident_memory_bytes{app=~"budget-.*"})
  ```

- **Resident Memory Usage for Budget Web App**:

  ```promql
  process_resident_memory_bytes{app="budget-web-app"}
  ```

- **Resident Memory Usage for Budget API App**:
  ```promql
  process_resident_memory_bytes{app="budget-api-app"}
  ```

### Summary

1. **Label Your Deployments**: Ensure your budget applications are properly labeled.
2. **Use PromQL Queries**: Use the labels in your PromQL queries to filter for metrics related to your budget apps.
3. **Access Prometheus UI**: Use port forwarding if necessary to access the Prometheus UI and execute your queries.
4. **Visualize Data**: Use the "Graph" and "Table" views in Prometheus to visualize your data.

By following these steps, you can query and monitor memory usage specifically for your budget applications using Prometheus.
