import re
from fuzzywuzzy import fuzz
from typing import Dict, List, Optional, Tuple
from bson.objectid import ObjectId
from pymongo.errors import PyMongoError
import logging
from .models import db
from .country_config_loader import get_config_loader

logger = logging.getLogger(__name__)


class MongoPayeeMappingsManager:
    """
    MongoDB-based payee mappings manager for improved AI categorization.
    Stores user-specific payee to category mappings in MongoDB.
    Now supports multiple countries via configuration.
    """
    
    def __init__(self, budget_uuid: str, country_code: str = None):
        self.budget_uuid = budget_uuid
        self.country_code = country_code  # Optional: specify country explicitly
        self.collection = db.payee_mappings
        self.config_loader = get_config_loader()
        
        # Ensure index on budget_uuid for performance
        try:
            self.collection.create_index("budget_uuid")
            logger.debug(f"Ensured index on budget_uuid for payee_mappings collection")
        except Exception as e:
            logger.warning(f"Could not create index: {e}")
    
    def _get_country_for_payee(self, payee_name: str) -> str:
        """
        Determine which country configuration to use for a payee.
        
        Args:
            payee_name: The payee name to analyze
            
        Returns:
            Country code to use for processing
        """
        if self.country_code:
            # If country is explicitly set, use that
            return self.country_code
        
        # Try to detect country from payee name
        detected = self.config_loader.detect_country_from_payee(payee_name)
        return detected
    
    def _normalize_payee_name(self, payee_name: str) -> str:
        """
        Normalize payee name for better fuzzy matching.
        Now uses country-specific configuration for intelligent processing.
        """
        # Convert to lowercase and strip
        normalized = payee_name.lower().strip()
        
        # Determine which country config to use
        country_code = self._get_country_for_payee(payee_name)
        country_config = self.config_loader.get_country_config(country_code)
        global_patterns = self.config_loader.get_global_patterns()
        
        logger.debug(f"Processing payee with {country_code} config: {normalized[:50]}")
        
        # Get all bank transaction indicators for this country
        bank_indicators = self.config_loader.get_all_bank_indicators(country_code)
        
        # Check if this looks like a bank transaction
        is_bank_transaction = any(indicator in normalized for indicator in bank_indicators)
        
        if is_bank_transaction:
            logger.debug(f"Detected bank transaction for {country_code}")
            
            # Remove bank prefixes
            bank_prefixes = self.config_loader.get_all_bank_prefixes(country_code)
            for prefix in bank_prefixes:
                if normalized.startswith(prefix):
                    normalized = normalized[len(prefix):].strip()
                    break
            
            # Apply split patterns to extract merchant name
            split_patterns = self.config_loader.get_all_split_patterns(country_code)
            for pattern in split_patterns:
                match = re.search(pattern, normalized)
                if match:
                    # Take everything before this pattern as the merchant name
                    normalized = normalized[:match.start()].strip()
                    break
            
            # If still very long after splitting, take first few words
            if len(normalized.split()) > 5:
                words = normalized.split()
                normalized = ' '.join(words[:3])
        
        # Remove business suffixes (country-specific + global)
        all_suffixes = country_config.get('business_suffixes', []) + global_patterns.get('common_business_suffixes', [])
        for suffix in all_suffixes:
            pattern = f'\\s+{suffix}\\b'
            normalized = re.sub(pattern, '', normalized)
        
        # Remove cities (country-specific)
        cities = country_config.get('cities', [])
        if cities:
            cities_pattern = '\\s+(' + '|'.join(cities) + ')$'
            normalized = re.sub(cities_pattern, '', normalized)
        
        # Remove location words (country-specific + global)
        all_location_words = country_config.get('location_words', []) + global_patterns.get('common_location_words', [])
        if all_location_words:
            location_pattern = '\\s+(' + '|'.join(all_location_words) + ')$'
            normalized = re.sub(location_pattern, '', normalized)
        
        # Remove numbers using global patterns
        number_patterns = global_patterns.get('number_patterns', [])
        for pattern in number_patterns:
            normalized = re.sub(pattern, '', normalized)
        
        # Remove payment method patterns (like domiciliëring + reference numbers)
        payment_patterns = global_patterns.get('payment_method_patterns', [])
        for pattern in payment_patterns:
            normalized = re.sub(pattern, '', normalized)
        
        # Clean up multiple spaces
        normalized = re.sub(r'\s+', ' ', normalized).strip()
        
        logger.debug(f"Normalized '{payee_name[:50]}...' → '{normalized}'")
        
        return normalized
    
    def add_mapping(self, payee_name: str, category_name: str) -> bool:
        """
        Add a new payee to category mapping.
        
        Args:
            payee_name: The payee name to map
            category_name: The target category name
            
        Returns:
            True if mapping was added successfully
        """
        try:
            # Use smart preprocessing instead of just lowercase/strip
            normalized_payee = self._normalize_payee_name(payee_name)
            
            # Use upsert to replace existing mapping or create new one
            result = self.collection.replace_one(
                {
                    "budget_uuid": self.budget_uuid,
                    "payee_name": normalized_payee
                },
                {
                    "budget_uuid": self.budget_uuid,
                    "payee_name": normalized_payee,
                    "category_name": category_name,
                    "original_payee_name": payee_name  # Keep original for display
                },
                upsert=True
            )
            
            action = "Updated" if result.matched_count > 0 else "Added"
            logger.info(f"{action} mapping: '{payee_name}' → '{category_name}' for budget {self.budget_uuid}")
            print(f"{action} mapping: '{payee_name}' → '{category_name}'")
            return True
            
        except PyMongoError as e:
            logger.error(f"MongoDB error adding mapping: {e}")
            print(f"Error adding mapping: {e}")
            return False
        except Exception as e:
            logger.error(f"Error adding mapping: {e}")
            print(f"Error adding mapping: {e}")
            return False
    
    def get_exact_mapping(self, payee_name: str) -> Optional[str]:
        """Get exact category mapping for a payee."""
        try:
            normalized_payee = payee_name.lower().strip()
            
            mapping = self.collection.find_one({
                "budget_uuid": self.budget_uuid,
                "payee_name": normalized_payee
            })
            
            return mapping["category_name"] if mapping else None
            
        except PyMongoError as e:
            logger.error(f"MongoDB error getting exact mapping: {e}")
            return None
        except Exception as e:
            logger.error(f"Error getting exact mapping: {e}")
            return None
    
    def get_fuzzy_mapping(self, payee_name: str, threshold: int = 85) -> Optional[Tuple[str, str, int]]:
        """
        Get fuzzy category mapping for a payee with smart preprocessing.
        
        Args:
            payee_name: The payee name to search for
            threshold: Minimum similarity score (0-100)
            
        Returns:
            Tuple of (matched_payee, category, score) or None
        """
        try:
            # Get all mappings for this budget
            mappings = list(self.collection.find({"budget_uuid": self.budget_uuid}))
            
            if not mappings:
                return None
            
            # First try with original payee name
            normalized_input = payee_name.lower().strip()
            best_match = None
            best_score = 0
            
            for mapping in mappings:
                known_payee = mapping["payee_name"]
                category = mapping["category_name"]
                
                score = fuzz.ratio(normalized_input, known_payee)
                if score >= threshold and score > best_score:
                    best_score = score
                    best_match = (known_payee, category, score)
            
            # If no match found, try with smart preprocessing
            if not best_match:
                preprocessed_input = self._normalize_payee_name(payee_name)
                
                for mapping in mappings:
                    known_payee = mapping["payee_name"]
                    category = mapping["category_name"]
                    
                    # Also preprocess the known payee for comparison
                    preprocessed_known = self._normalize_payee_name(known_payee)
                    
                    score = fuzz.ratio(preprocessed_input, preprocessed_known)
                    if score >= threshold and score > best_score:
                        best_score = score
                        best_match = (known_payee, category, score)
            
            return best_match
            
        except PyMongoError as e:
            logger.error(f"MongoDB error getting fuzzy mapping: {e}")
            return None
        except Exception as e:
            logger.error(f"Error getting fuzzy mapping: {e}")
            return None
    
    def get_mapping_with_fallback(self, payee_name: str) -> Optional[Tuple[str, str, str]]:
        """
        Get mapping with exact match preferred, fuzzy as fallback.
        
        Returns:
            Tuple of (category, match_type, matched_payee) or None
            match_type can be 'exact' or 'fuzzy'
        """
        # Try exact match first
        exact_match = self.get_exact_mapping(payee_name)
        if exact_match:
            return (exact_match, 'exact', payee_name.lower().strip())
        
        # Try fuzzy match as fallback
        fuzzy_match = self.get_fuzzy_mapping(payee_name)
        if fuzzy_match:
            matched_payee, category, score = fuzzy_match
            return (category, 'fuzzy', matched_payee)
        
        return None
    
    def remove_mapping(self, payee_name: str) -> bool:
        """Remove a payee mapping."""
        try:
            normalized_payee = payee_name.lower().strip()
            
            # First get the mapping to show what was removed
            mapping = self.collection.find_one({
                "budget_uuid": self.budget_uuid,
                "payee_name": normalized_payee
            })
            
            if not mapping:
                return False
            
            # Delete the mapping
            result = self.collection.delete_one({
                "budget_uuid": self.budget_uuid,
                "payee_name": normalized_payee
            })
            
            if result.deleted_count > 0:
                category = mapping["category_name"]
                logger.info(f"Removed mapping: '{payee_name}' → '{category}' for budget {self.budget_uuid}")
                print(f"Removed mapping: '{payee_name}' → '{category}'")
                return True
            
            return False
            
        except PyMongoError as e:
            logger.error(f"MongoDB error removing mapping: {e}")
            print(f"Error removing mapping: {e}")
            return False
        except Exception as e:
            logger.error(f"Error removing mapping: {e}")
            print(f"Error removing mapping: {e}")
            return False
    
    def get_all_mappings(self) -> Dict[str, str]:
        """Get all current mappings."""
        try:
            mappings = {}
            
            cursor = self.collection.find({"budget_uuid": self.budget_uuid})
            for mapping in cursor:
                payee_name = mapping["payee_name"]
                category_name = mapping["category_name"]
                mappings[payee_name] = category_name
            
            return mappings
            
        except PyMongoError as e:
            logger.error(f"MongoDB error getting all mappings: {e}")
            return {}
        except Exception as e:
            logger.error(f"Error getting all mappings: {e}")
            return {}
    
    def get_mappings_for_prompt(self) -> str:
        """
        Get mappings formatted for inclusion in AI prompts.
        
        Returns:
            Formatted string for prompt injection
        """
        mappings = self.get_all_mappings()
        
        if not mappings:
            return ""
        
        mapping_lines = []
        for payee, category in mappings.items():
            mapping_lines.append(f"- '{payee}' → {category}")
        
        return f"""
Known payee mappings for this user:
{chr(10).join(mapping_lines)}

If the transaction payee exactly matches or is very similar to any of the known payees above, use the corresponding category.
"""
    
    def learn_from_transaction_update(self, payee_name: str, category_name: str, auto_learn: bool = False) -> bool:
        """
        Learn from a user's manual categorization.
        
        Args:
            payee_name: The payee that was categorized
            category_name: The category the user assigned
            auto_learn: Whether to automatically add this mapping
            
        Returns:
            True if learning was successful
        """
        if auto_learn:
            return self.add_mapping(payee_name, category_name)
        else:
            # Just log the potential learning opportunity
            logger.info(f"Learning opportunity: '{payee_name}' → '{category_name}' for budget {self.budget_uuid}")
            print(f"Learning opportunity: '{payee_name}' → '{category_name}'")
            return True
    
    def test_preprocessing(self, payee_name: str) -> str:
        """
        Test method to see how payee name preprocessing works.
        Useful for debugging and understanding matching behavior.
        """
        return self._normalize_payee_name(payee_name)
    
    def get_mapping_stats(self) -> Dict:
        """Get statistics about mappings for this budget."""
        try:
            total_mappings = self.collection.count_documents({"budget_uuid": self.budget_uuid})
            
            # Get category distribution
            pipeline = [
                {"$match": {"budget_uuid": self.budget_uuid}},
                {"$group": {"_id": "$category_name", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            
            category_stats = list(self.collection.aggregate(pipeline))
            
            return {
                "total_mappings": total_mappings,
                "category_distribution": category_stats,
                "budget_uuid": self.budget_uuid
            }
            
        except PyMongoError as e:
            logger.error(f"MongoDB error getting mapping stats: {e}")
            return {"error": str(e)}
        except Exception as e:
            logger.error(f"Error getting mapping stats: {e}")
            return {"error": str(e)} 