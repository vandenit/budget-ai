# AI Authomatic Categorisation

## Current status
- google cloud api calls web api with secret. this calls the private api that updates the budgets

## Wanted status
- the private api calls for each budget also the math-api:
POST http://127.0.0.1:5000/uncategorised-transactions/apply-categories?budget_id=1b443ebf-ea07-4ab7-8fd5-9330bf80608c
so that categories are kept up to date

## Todo
- [ ] make sure the private api can access the math-api in kubernetes (but don't expose it to the public)
- [ ] in the sync call the api for each budget. can be async
