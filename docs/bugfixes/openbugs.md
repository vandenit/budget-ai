# open bugs
## apply all doesn't take into account changed categories
- I changed some categories in the ai assistant screen. when I then pressed apply all they were not applied. only with a single apply
- when applying a change in the uncategorised or unapproved only the number on top in the badge is updated, but the transaction itself and the number below are only upated after a refresh
## wrong payee mapping

### description

\_id
683f03e78200e8996f2eee6d
budget_uuid
"1b443ebf-ea07-4ab7-8fd5-9330bf80608c"
payee_name
"vanden it - gezamenlijke overschrijvingsopdracht referentie 1004982/20…"
category_name
"Salery"
original_payee_name
"VANDEN IT BV - Gezamenlijke overschrijvingsopdracht Referentie 1004982…"

The mapped payee mapping should be "vandent it" or "vandent IT BV" instead of "vanden it - gezamenlijke overschrijvingsopdracht referentie 1004982/2025"

### proposed solution

Improve the preprocessing of the payee name to remove bank-specific details and keep only the core merchant name. Make sure the part "gezamelijke overschrijvingsopdracht" is not hardcoded but part of the country specific configuration.
Also take into account the sign of the amount to link with a payee

# local start gives these sentry errors
```
[0]  ⚠ ../../node_modules/@opentelemetry/instrumentation/build/esm/platform/node/instrumentation.js
[0] Critical dependency: the request of a dependency is an expression
[0] 
[0] Import trace for requested module:
[0] ../../node_modules/@opentelemetry/instrumentation/build/esm/platform/node/instrumentation.js
[0] ../../node_modules/@opentelemetry/instrumentation/build/esm/platform/node/index.js
[0] ../../node_modules/@opentelemetry/instrumentation/build/esm/platform/index.js
[0] ../../node_modules/@opentelemetry/instrumentation/build/esm/index.js
[0] ../../node_modules/@sentry/node/build/cjs/integrations/node-fetch.js
[0] ../../node_modules/@sentry/node/build/cjs/index.js
[0] ../../node_modules/@sentry/nextjs/build/cjs/index.server.js
[0] ./app/global-error.tsx
[0] 
[0] ../../node_modules/require-in-the-middle/index.js
[0] Critical dependency: require function is used in a way in which dependencies cannot be statically extracted
[0] 
[0] Import trace for requested module:
[0] ../../node_modules/require-in-the-middle/index.js
[0] ../../node_modules/@opentelemetry/instrumentation/build/esm/platform/node/instrumentation.js
[0] ../../node_modules/@opentelemetry/instrumentation/build/esm/platform/node/index.js
[0] ../../node_modules/@opentelemetry/instrumentation/build/esm/platform/index.js
[0] ../../node_modules/@opentelemetry/instrumentation/build/esm/index.js
[0] ../../node_modules/@sentry/node/build/cjs/integrations/node-fetch.js
[0] ../../node_modules/@sentry/node/build/cjs/index.js
[0] ../../node_modules/@sentry/nextjs/build/cjs/index.server.js
[0] ./app/global-error.tsx
[0]  ⚠ ../../node_modules/@opentelemetry/instrumentation/build/esm/platform/node/instrumentation.js
[0] Critical dependency: the request of a dependency is an expression
[0] 
[0] Import trace for requested module:
[0] ../../node_modules/@opentelemetry/instrumentation/build/esm/platform/node/instrumentation.js
[0] ../../node_modules/@opentelemetry/instrumentation/build/esm/platform/node/index.js
[0] ../../node_modules/@opentelemetry/instrumentation/build/esm/platform/index.js
[0] ../../node_modules/@opentelemetry/instrumentation/build/esm/index.js
[0] ../../node_modules/@sentry/opentelemetry/build/cjs/index.js
[0] ../../node_modules/@sentry/nextjs/build/cjs/server/index.js
[0] ../../node_modules/@sentry/nextjs/build/cjs/index.server.js
[0] ./app/global-error.tsx
[0] 
[0] ../../node_modules/require-in-the-middle/index.js
[0] Critical dependency: require function is used in a way in which dependencies cannot be statically extracted
[0] 
[0] Import trace for requested module:
[0] ../../node_modules/require-in-the-middle/index.js
[0] ../../node_modules/@opentelemetry/instrumentation/build/esm/platform/node/instrumentation.js
[0] ../../node_modules/@opentelemetry/instrumentation/build/esm/platform/node/index.js
[0] ../../node_modules/@opentelemetry/instrumentation/build/esm/platform/index.js
[0] ../../node_modules/@opentelemetry/instrumentation/build/esm/index.js
[0] ../../node_modules/@sentry/opentelemetry/build/cjs/index.js
[0] ../../node_modules/@sentry/nextjs/build/cjs/server/index.js
[0] ../../node_modules/@sentry/nextjs/build/cjs/index.server.js
[0] ./app/global-error.tsx
[0]  GET /login 200 in 1610ms
[0]  GET /.well-known/appspecific/com.chrome.devtools.json 404 in 103ms
[0]  GET /favicon.ico 200 in 42ms
[0]  GET /a
```

# getting 400 when opening homepage without logs
[0]  GET /api/auth/me 400 in 83ms