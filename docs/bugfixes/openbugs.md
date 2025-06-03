# open bugs

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
