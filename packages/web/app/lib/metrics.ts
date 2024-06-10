import client from "prom-client";

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default metrics collection to the registry
client.collectDefaultMetrics({ register });

// Export the registry
export default register;
