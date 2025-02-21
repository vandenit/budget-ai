# AI Automatic Categorization

For development guidelines, refer to [Best Practices](../best-practices.md)

## Current status
- Google Cloud API calls web API with secret, which then calls the private API to update budgets

## Wanted status
- The private API calls the math-api for each budget:
POST http://127.0.0.1:5000/uncategorised-transactions/apply-categories?budget_id=1b443ebf-ea07-4ab7-8fd5-9330bf80608c
This ensures categories are kept up to date automatically

## Todo
- [ ] Ensure math-api is accessible from private API in Kubernetes (but not exposed publicly)
- [ ] Implement asynchronous API calls for each budget during sync process
