# OpenAI Batch API Integration for Transaction Categorization

This implementation adds OpenAI Batch API support to the mathapi for cost-effective categorization of YNAB transactions.

## Benefits of Batch API

- **50% cost savings** compared to regular API calls
- **Higher rate limits** for large-scale processing
- **Asynchronous processing** - no waiting for real-time responses
- **Improved efficiency** for large numbers of transactions

## Available Endpoints

### 1. Synchronous Batch Processing (Waits for results)

#### `GET /uncategorised-transactions/suggest-categories-batch`
Suggests categories for all uncategorized transactions using batch processing but waits for completion.

**Parameters:**
- `budget_id` (query parameter): YNAB budget UUID

**Response:**
```json
{
  "suggested_transactions": [
    {
      "transaction_id": "transaction-uuid",
      "payee_name": "Supermarket",
      "amount": -2500,
      "date": "2024-01-15",
      "suggested_category_name": "Groceries"
    }
  ],
  "total_processed": 10
}
```

#### `POST /uncategorised-transactions/apply-categories-batch`
Suggests and applies categories directly using batch processing.

**Parameters:**
- `budget_id` (query parameter): YNAB budget UUID

**Response:**
```json
{
  "updated_transactions": [...],
  "failed_transactions": [...],
  "total_processed": 10,
  "total_updated": 8,
  "total_failed": 2
}
```

### 2. Asynchronous Batch Processing (Start job and check later)

#### `POST /uncategorised-transactions/start-batch-job`
Starts an asynchronous batch job for categorization.

**Parameters:**
- `budget_id` (query parameter): YNAB budget UUID

**Response:**
```json
{
  "message": "Batch job started for 15 transactions",
  "batch_id": "batch_xyz123",
  "total_transactions": 15
}
```

#### `GET /batch-jobs/{batch_id}/status`
Check the status of a batch job.

**Response:**
```json
{
  "batch_id": "batch_xyz123",
  "status": "completed",
  "has_results": true,
  "error_message": null
}
```

**Possible statuses:**
- `validating` - Job is being validated
- `in_progress` - Job is being executed
- `finalizing` - Job is being finalized
- `completed` - Job is finished
- `failed` - Job has failed
- `cancelled` - Job has been cancelled

#### `POST /batch-jobs/{batch_id}/apply-results`
Applies the results of a completed batch job to YNAB transactions.

**Parameters:**
- `budget_id` (query parameter): YNAB budget UUID

**Response:**
```json
{
  "batch_id": "batch_xyz123",
  "updated_transactions": [...],
  "failed_transactions": [...],
  "total_updated": 8,
  "total_failed": 2
}
```

## Usage Scenarios

### Scenario 1: Direct Batch Processing (Synchronous)
For smaller numbers of transactions where you want immediate results:

1. `POST /uncategorised-transactions/apply-categories-batch?budget_id={budget_uuid}`
2. Wait for response with results

### Scenario 2: Asynchronous Batch Processing
For large numbers of transactions or when you want to continue with other tasks:

1. `POST /uncategorised-transactions/start-batch-job?budget_id={budget_uuid}`
2. Receive `batch_id`
3. Periodically check: `GET /batch-jobs/{batch_id}/status`
4. When status = "completed": `POST /batch-jobs/{batch_id}/apply-results?budget_id={budget_uuid}`

## Backward Compatibility

The original endpoints remain available:
- `GET /uncategorised-transactions/suggest-categories` (single requests)
- `POST /uncategorised-transactions/apply-categories` (single requests)

## Technical Details

### In-Memory File Handling
- **No disk I/O**: Uses `BytesIO` objects instead of writing temporary files to disk
- **Faster processing**: All file operations happen in memory for better performance  
- **Automatic cleanup**: No need to manually delete temporary files
- **Lower resource usage**: Reduces disk space usage and file system operations
- Note: File-like objects are still required because OpenAI Batch API expects file uploads

### Error Handling
- Comprehensive error logging and reporting
- Graceful handling of partial failures
- Retry logic and timeout management
- JSON parsing error handling for batch results

### YNAB Integration
- Different flag colors for identification:
  - Blue: Regular AI suggestions
  - Green: Synchronous batch processing
  - Purple: Asynchronous batch processing
- Memos are updated with processing type

### Costs & Performance
- Batch API: 50% cheaper than regular requests
- Completion within 24 hours (usually much faster)
- Higher rate limits than normal API calls
- In-memory processing for optimal performance

## Environment Variables

Make sure the following environment variable is set:
- `AI_OPENAI_API_KEY`: OpenAI API key with access to Batch API

## Usage Examples

### Python Client Example
```python
import requests

# Start asynchronous batch job
response = requests.post(
    'http://mathapi/uncategorised-transactions/start-batch-job',
    params={'budget_id': 'your-budget-uuid'}
)
batch_id = response.json()['batch_id']

# Check status
status_response = requests.get(f'http://mathapi/batch-jobs/{batch_id}/status')
print(status_response.json())

# Apply results when completed
if status_response.json()['status'] == 'completed':
    results = requests.post(
        f'http://mathapi/batch-jobs/{batch_id}/apply-results',
        params={'budget_id': 'your-budget-uuid'}
    )
    print(results.json())
```

## Monitoring & Logging

All batch operations are logged at INFO level:
- Job creation and submission
- Status updates
- Results processing
- Error conditions

Use logging configuration to monitor batch processing. 