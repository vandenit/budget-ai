# 🚀 Uncategorised Transactions UX Improvements

## Probleem
Met 50+ uncategorised transacties duurt het laden van de pagina veel te lang omdat:
- Alle AI suggesties synchroon worden opgehaald (50 × 2-3 sec = 100-150 sec)
- Hoge OpenAI kosten door herberekening van dezelfde suggesties
- Slechte UX: gebruiker ziet niets tot alles geladen is

## Oplossing: Progressive Loading + Caching

### 1. Immediate Page Load
- Toon uncategorised transacties direct zonder AI suggesties
- Gebruiker kan meteen transacties zien en handmatig categoriseren
- Loading indicators voor AI suggesties

### 2. Async AI Suggestions
- AI suggesties worden op de achtergrond geladen
- Progressive updates: suggesties verschijnen zodra ze beschikbaar zijn
- Batch processing voor betere performance

### 3. Database Caching
- Sla AI suggesties op in MongoDB collection `ai_suggestions`
- Cache key: `{budget_id}_{transaction_id}_{payee_name_hash}`
- TTL: 7 dagen (suggesties kunnen verbeteren door nieuwe mappings)

### 4. Smart Loading Strategy
```
1. Load transactions immediately (fast)
2. Check cache for existing suggestions (very fast)
3. Load missing suggestions async (background)
4. Update UI progressively as suggestions arrive
```

## Implementatie Plan

### Backend Changes
1. **Nieuwe MongoDB collection**: `ai_suggestions`
2. **Cache service**: Check/store suggestions
3. **Async endpoints**: Non-blocking suggestion loading
4. **Batch optimization**: Process multiple transactions efficiently

### Frontend Changes
1. **Immediate loading**: Show transactions without waiting for AI
2. **Progressive updates**: Update suggestions as they arrive
3. **Loading states**: Clear indicators for pending suggestions
4. **Manual override**: Allow immediate manual categorization

### Database Schema
```javascript
{
  _id: ObjectId,
  budget_id: String,
  transaction_id: String,
  payee_name: String,
  payee_hash: String, // For fuzzy matching
  amount: Number,
  suggested_category: String,
  confidence: Number, // AI confidence score
  created_at: Date,
  expires_at: Date, // TTL index
  version: Number // For cache invalidation
}
```

## Benefits
- ⚡ **Instant page load**: Transacties direct zichtbaar
- 💰 **Cost reduction**: 80-90% minder OpenAI calls door caching
- 🎯 **Better UX**: Progressive loading, geen lange wachttijden
- 🔄 **Flexibility**: Gebruiker kan direct handmatig categoriseren
- 📈 **Scalability**: Werkt goed met honderden transacties

## Implementation Status
- [ ] MongoDB ai_suggestions collection
- [ ] Cache service implementation
- [ ] Async suggestion endpoints
- [ ] Frontend progressive loading
- [ ] Batch processing optimization
- [ ] TTL and cache invalidation 