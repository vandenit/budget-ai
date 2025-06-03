"""
Simple AI Suggestions Service

Stores AI category suggestions directly in the existing localtransactions collection.
Much simpler than a separate cache - just adds ai_suggested_category field to existing transactions.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from .db import get_DB
from .budget_api import get_objectid_for_budget

logger = logging.getLogger(__name__)

class SimpleAISuggestionsService:
    """
    Simple service to store/retrieve AI suggestions in existing localtransactions collection.
    
    Just adds these fields to existing transaction documents:
    - ai_suggested_category: string (category name)
    - ai_suggestion_date: datetime (when suggestion was made)
    - ai_suggestion_confidence: float (confidence score 0.0-1.0)
    """
    
    def __init__(self, budget_uuid: str):
        self.budget_uuid = budget_uuid
        self.budget_id = get_objectid_for_budget(budget_uuid)
        self.db = get_DB()
        self.collection = self.db.localtransactions
        
        if not self.budget_id:
            raise ValueError(f"No budget found for UUID: {budget_uuid}")
    
    def get_cached_suggestion(self, transaction_id: str) -> Optional[str]:
        """
        Get cached AI suggestion for a transaction.
        
        Args:
            transaction_id: YNAB transaction ID
            
        Returns:
            Cached category name or None if not found/expired
        """
        try:
            # Look for transaction in our local collection using 'uuid' field (not 'id')
            transaction = self.collection.find_one({
                "budgetId": self.budget_id,
                "uuid": transaction_id,  # Changed from "id" to "uuid"
                "ai_suggested_category": {"$exists": True, "$ne": None}
            })
            
            if transaction:
                # Check if suggestion is not too old (7 days)
                suggestion_date = transaction.get("ai_suggestion_date")
                if suggestion_date:
                    age = datetime.utcnow() - suggestion_date
                    if age.days <= 7:
                        logger.debug(f"Cache hit for transaction {transaction_id}: {transaction['ai_suggested_category']}")
                        return transaction["ai_suggested_category"]
                    else:
                        logger.debug(f"Cached suggestion expired for transaction {transaction_id}")
                        return None
                else:
                    # Old suggestion without date - still valid but add date
                    logger.debug(f"Cache hit (no date) for transaction {transaction_id}: {transaction['ai_suggested_category']}")
                    return transaction["ai_suggested_category"]
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting cached suggestion for {transaction_id}: {e}")
            return None
    
    def get_cached_suggestions_batch(self, transaction_ids: List[str]) -> Dict[str, str]:
        """
        Get cached AI suggestions for multiple transactions.
        
        Args:
            transaction_ids: List of YNAB transaction IDs
            
        Returns:
            Dict mapping transaction_id to cached category name
        """
        try:
            # Find all transactions with cached suggestions using 'uuid' field
            transactions = self.collection.find({
                "budgetId": self.budget_id,
                "uuid": {"$in": transaction_ids},  # Changed from "id" to "uuid"
                "ai_suggested_category": {"$exists": True, "$ne": None}
            })
            
            cached_suggestions = {}
            cutoff_date = datetime.utcnow() - timedelta(days=7)
            
            for transaction in transactions:
                transaction_id = transaction["uuid"]  # Changed from "id" to "uuid"
                suggested_category = transaction["ai_suggested_category"]
                suggestion_date = transaction.get("ai_suggestion_date")
                
                # Check if not expired (or no date = keep it)
                if not suggestion_date or suggestion_date >= cutoff_date:
                    cached_suggestions[transaction_id] = suggested_category
                    logger.debug(f"Cached: {transaction_id} → {suggested_category}")
            
            logger.info(f"Found {len(cached_suggestions)}/{len(transaction_ids)} cached suggestions")
            return cached_suggestions
            
        except Exception as e:
            logger.error(f"Error getting cached suggestions batch: {e}")
            return {}
    
    def store_suggestion(self, transaction_id: str, payee_name: str, 
                        suggested_category: str, confidence: float = 0.8) -> bool:
        """
        Store AI suggestion in the existing transaction document.
        
        Args:
            transaction_id: YNAB transaction ID (UUID)
            payee_name: Transaction payee name
            suggested_category: AI suggested category name
            confidence: AI confidence score (0.0-1.0)
            
        Returns:
            True if stored successfully, False otherwise
        """
        try:
            # Update the existing transaction document using 'uuid' field
            result = self.collection.update_one(
                {
                    "budgetId": self.budget_id,
                    "uuid": transaction_id  # Changed from "id" to "uuid"
                },
                {
                    "$set": {
                        "ai_suggested_category": suggested_category,
                        "ai_suggestion_date": datetime.utcnow(),
                        "ai_suggestion_confidence": confidence
                    }
                }
            )
            
            if result.modified_count > 0:
                logger.debug(f"Stored suggestion for {transaction_id}: {suggested_category}")
                return True
            else:
                # Transaction might not exist in local collection yet
                # Create a minimal document for caching
                self.collection.update_one(
                    {
                        "budgetId": self.budget_id,
                        "uuid": transaction_id  # Changed from "id" to "uuid"
                    },
                    {
                        "$set": {
                            "budgetId": self.budget_id,
                            "uuid": transaction_id,  # Changed from "id" to "uuid"
                            "payeeName": payee_name,  # Use correct field name
                            "ai_suggested_category": suggested_category,
                            "ai_suggestion_date": datetime.utcnow(),
                            "ai_suggestion_confidence": confidence,
                            "_cache_only": True  # Mark as cache-only document
                        }
                    },
                    upsert=True
                )
                logger.debug(f"Created cache document for {transaction_id}: {suggested_category}")
                return True
                
        except Exception as e:
            logger.error(f"Error storing suggestion for {transaction_id}: {e}")
            return False
    
    def store_suggestions_batch(self, suggestions: List[Dict]) -> int:
        """
        Store multiple AI suggestions.
        
        Args:
            suggestions: List of dicts with transaction_id, payee_name, suggested_category, confidence
            
        Returns:
            Number of suggestions successfully stored
        """
        stored_count = 0
        
        for suggestion in suggestions:
            try:
                transaction_id = suggestion["transaction_id"]
                payee_name = suggestion["payee_name"]
                suggested_category = suggestion["suggested_category"]
                confidence = suggestion.get("confidence", 0.8)
                
                if self.store_suggestion(transaction_id, payee_name, suggested_category, confidence):
                    stored_count += 1
                    
            except Exception as e:
                logger.warning(f"Failed to store suggestion: {e}")
                continue
        
        logger.info(f"Stored {stored_count}/{len(suggestions)} suggestions")
        return stored_count
    
    def invalidate_suggestions(self, transaction_ids: Optional[List[str]] = None) -> int:
        """
        Invalidate (remove) cached suggestions.
        
        Args:
            transaction_ids: Specific transaction IDs to invalidate, or None for all in budget
            
        Returns:
            Number of suggestions invalidated
        """
        try:
            if transaction_ids:
                query = {
                    "budgetId": self.budget_id,
                    "uuid": {"$in": transaction_ids}  # Changed from "id" to "uuid"
                }
            else:
                query = {
                    "budgetId": self.budget_id
                }
            
            # Remove AI suggestion fields (but keep the transaction document)
            result = self.collection.update_many(
                query,
                {
                    "$unset": {
                        "ai_suggested_category": "",
                        "ai_suggestion_date": "",
                        "ai_suggestion_confidence": ""
                    }
                }
            )
            
            # Also remove cache-only documents
            cache_result = self.collection.delete_many({
                **query,
                "_cache_only": True
            })
            
            total_invalidated = result.modified_count + cache_result.deleted_count
            logger.info(f"Invalidated {total_invalidated} cached suggestions")
            return total_invalidated
            
        except Exception as e:
            logger.error(f"Error invalidating suggestions: {e}")
            return 0
    
    def get_stats(self) -> Dict:
        """Get statistics about cached suggestions for this budget."""
        try:
            total_with_suggestions = self.collection.count_documents({
                "budgetId": self.budget_id,
                "ai_suggested_category": {"$exists": True, "$ne": None}
            })
            
            # Count recent suggestions (last 7 days)
            cutoff_date = datetime.utcnow() - timedelta(days=7)
            recent_suggestions = self.collection.count_documents({
                "budgetId": self.budget_id,
                "ai_suggested_category": {"$exists": True, "$ne": None},
                "ai_suggestion_date": {"$gte": cutoff_date}
            })
            
            # Count cache-only documents
            cache_only = self.collection.count_documents({
                "budgetId": self.budget_id,
                "_cache_only": True
            })
            
            return {
                "budget_uuid": self.budget_uuid,
                "total_with_suggestions": total_with_suggestions,
                "recent_suggestions": recent_suggestions,
                "expired_suggestions": total_with_suggestions - recent_suggestions,
                "cache_only_documents": cache_only
            }
            
        except Exception as e:
            logger.error(f"Error getting suggestion stats: {e}")
            return {"error": str(e)} 