# 🧠 Payee Mappings - AI Memory System

## Problem: AI cannot recognize all payees correctly

**Examples:**
- "Rush rush" = coffee shop → "Eating out" 
- "NS" = Dutch Railways → "Transportation"
- "Albert" = Albert Heijn → "Groceries"

OpenAI doesn't know all Dutch/local businesses and needs context.

## Solution: Smart Payee Learning System

### 🎯 **How it works:**

1. **Local mappings**: User teaches AI which payees should map to which categories
2. **Instant lookup**: For known payees no expensive API call needed
3. **Fuzzy matching**: "McDonald" matches with "McDonald's" 
4. **Context injection**: Unknown payees get context from known mappings

### 💰 **Benefits:**

- **Cheaper**: Known payees = €0.00 (no API call)
- **Faster**: Instant lookup vs 1-2 seconds API call
- **More accurate**: User determines categories themselves
- **Learning**: Gets better as more mappings are added

---

## 🚀 **API Endpoints**

### 1. Get All Mappings
```http
GET /payee-mappings/{budget_id}
```

**Response:**
```json
{
  "budget_id": "your-budget-uuid",
  "mappings": {
    "rush rush": "Eating out",
    "albert heijn": "Groceries",
    "ns international": "Transportation"
  },
  "total_mappings": 3
}
```

### 2. Add New Mapping
```http
POST /payee-mappings/{budget_id}
Content-Type: application/json

{
  "payee_name": "Rush rush",
  "category_name": "Eating out"
}
```

**Response:**
```json
{
  "message": "Added mapping: 'Rush rush' → 'Eating out'",
  "payee_name": "Rush rush", 
  "category_name": "Eating out"
}
```

### 3. Remove Mapping
```http
DELETE /payee-mappings/{budget_id}/Rush%20rush
```

**Response:**
```json
{
  "message": "Removed mapping for 'Rush rush'"
}
```

### 4. Search Mapping
```http
GET /payee-mappings/{budget_id}/search?payee_name=Rush
```

**Response:**
```json
{
  "payee_name": "Rush",
  "category_name": "Eating out",
  "match_type": "fuzzy",
  "matched_payee": "rush rush",
  "similarity_score": 95
}
```

---

## 🔄 **Automatic Integration**

### Smart Processing uses mappings automatically:

```bash
# All existing endpoints now automatically use mappings
POST /uncategorised-transactions/apply-categories-smart?budget_id=xxx&urgency=immediate

# For transaction with payee "Rush rush":
# 1. ✅ Check mappings → instant "Eating out" (free!)
# 2. ❌ No OpenAI API call needed
```

### Logging output:
```
🎯 Found exact mapping: 'Rush rush' → 'Eating out' (matched: 'rush rush')
✅ Processed 10 transactions: 7 mapped, 3 via API
```

---

## 📋 **Practical Usage**

### Scenario 1: Adding new mappings
```bash
# For your "Rush rush" example:
curl -X POST "http://localhost:5000/payee-mappings/your-budget-uuid" \
  -H "Content-Type: application/json" \
  -d '{
    "payee_name": "Rush rush",
    "category_name": "Eating out"
  }'
```

### Scenario 2: Viewing existing mappings
```bash
curl "http://localhost:5000/payee-mappings/your-budget-uuid"
```

### Scenario 3: Testing fuzzy search
```bash
curl "http://localhost:5000/payee-mappings/your-budget-uuid/search?payee_name=Rush"
```

---

## 🧪 **Features**

### ✅ **Exact Matching**
- "rush rush" = "Rush rush" ✅
- "RUSH RUSH" = "Rush rush" ✅ (case insensitive)

### ✅ **Fuzzy Matching** 
- "McDonald" matches "McDonald's" (89% similarity)
- "Albert" matches "Albert Heijn" (if > 85% similarity)

### ✅ **Smart Fallback**
1. Try exact match first (fastest)
2. Try fuzzy match as backup
3. Use OpenAI API if no match

### ✅ **Context Injection**
For unknown payees the prompt is enriched with:
```
Known payee mappings for this user:
- 'rush rush' → Eating out
- 'albert heijn' → Groceries  
- 'ns international' → Transportation

If the transaction payee exactly matches or is very similar to any of the known payees above, use the corresponding category.
```

---

## 💡 **Best Practices**

### 1. Add frequently occurring payees:
```bash
# Dutch examples:
"Albert Heijn" → "Groceries"
"NS" → "Transportation" 
"Shell" → "Transportation"
"Bol.com" → "Shopping"
"Action" → "Shopping"
```

### 2. Use consistent naming:
- "McDonald's" (with apostrophe)
- "Albert Heijn" (full name)

### 3. Monitor the logs:
```
🎯 Pre-mapped exact: 'Rush rush' → 'Eating out'
📋 Processing 3 unmapped transactions via batch API...
✅ All 10 transactions resolved via mappings!
```

---

## 🔧 **Technical Details**

### File Storage:
- **Location**: `app/user_mappings/{budget_uuid}_mappings.json`
- **Format**: JSON key-value pairs
- **Security**: Per-budget isolation

### Fuzzy Matching:
- **Algorithm**: Levenshtein distance via fuzzywuzzy
- **Threshold**: 85% similarity (configurable)
- **Performance**: C-optimized with python-levenshtein

### Memory:
- **Lazy loading**: Mappings are loaded on first use
- **Automatic saving**: Every change is immediately saved
- **Thread-safe**: Multiple requests can safely run simultaneously

---

## 🎯 **For your "Rush rush" example:**

```bash
# 1. Add mapping:
curl -X POST "http://localhost:5000/payee-mappings/your-budget-uuid" \
  -H "Content-Type: application/json" \
  -d '{"payee_name": "Rush rush", "category_name": "Eating out"}'

# 2. Test categorization (now free & instant!):
curl -X POST "http://localhost:5000/uncategorised-transactions/apply-categories-smart?budget_id=your-budget-uuid&urgency=immediate"

# Result: 🎯 Found exact mapping: 'Rush rush' → 'Eating out'
```

**Now the AI "remembers" that "Rush rush" = "Eating out" for your budget! 🧠✨** 