import json
import os
import re
from fuzzywuzzy import fuzz
from typing import Dict, List, Optional, Tuple


class PayeeMappingsManager:
    """
    Manages user-specific payee to category mappings for improved AI categorization.
    Provides fuzzy matching and learning capabilities.
    """
    
    def __init__(self, budget_uuid: str):
        self.budget_uuid = budget_uuid
        self.mappings_dir = os.path.join(os.path.dirname(__file__), "user_mappings")
        self.mappings_file = os.path.join(self.mappings_dir, f"{budget_uuid}_mappings.json")
        self._ensure_mappings_dir()
        self.mappings = self._load_mappings()
    
    def _ensure_mappings_dir(self):
        """Ensure the mappings directory exists."""
        os.makedirs(self.mappings_dir, exist_ok=True)
    
    def _load_mappings(self) -> Dict[str, str]:
        """Load existing payee mappings from file."""
        if os.path.exists(self.mappings_file):
            try:
                with open(self.mappings_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading mappings: {e}")
                return {}
        return {}
    
    def _save_mappings(self):
        """Save current mappings to file."""
        try:
            with open(self.mappings_file, 'w') as f:
                json.dump(self.mappings, f, indent=2)
        except Exception as e:
            print(f"Error saving mappings: {e}")
    
    def _normalize_payee_name(self, payee_name: str) -> str:
        """
        Normalize payee name for better fuzzy matching.
        Removes common suffixes, numbers, and standardizes format.
        """
        # Convert to lowercase and strip
        normalized = payee_name.lower().strip()
        
        # Remove common business suffixes
        suffixes = [
            r'\s+bv\b', r'\s+b\.v\.\b', r'\s+ltd\b', r'\s+limited\b',
            r'\s+inc\b', r'\s+incorporated\b', r'\s+corp\b', r'\s+corporation\b',
            r'\s+llc\b', r'\s+nv\b', r'\s+n\.v\.\b'
        ]
        for suffix in suffixes:
            normalized = re.sub(suffix, '', normalized)
        
        # Remove trailing numbers and common location indicators
        patterns = [
            r'\s+\d{3,}$',  # Remove 3+ digit numbers at end (e.g., "123456")
            r'\s+[a-z\s]*\d+[a-z\s]*$',  # Remove text with numbers at end (e.g., "station 789")
            r'\s+(amsterdam|rotterdam|utrecht|den haag|eindhoven|groningen|tilburg|almere|breda|nijmegen)$',  # Dutch cities
            r'\s+(store|shop|station|drive|center|centre|mall|plaza)$',  # Common location words
        ]
        for pattern in patterns:
            normalized = re.sub(pattern, '', normalized)
        
        # Clean up multiple spaces
        normalized = re.sub(r'\s+', ' ', normalized).strip()
        
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
            # Normalize payee name (lowercase, strip)
            normalized_payee = payee_name.lower().strip()
            self.mappings[normalized_payee] = category_name
            self._save_mappings()
            print(f"Added mapping: '{payee_name}' → '{category_name}'")
            return True
        except Exception as e:
            print(f"Error adding mapping: {e}")
            return False
    
    def get_exact_mapping(self, payee_name: str) -> Optional[str]:
        """Get exact category mapping for a payee."""
        normalized_payee = payee_name.lower().strip()
        return self.mappings.get(normalized_payee)
    
    def get_fuzzy_mapping(self, payee_name: str, threshold: int = 85) -> Optional[Tuple[str, str, int]]:
        """
        Get fuzzy category mapping for a payee with smart preprocessing.
        
        Args:
            payee_name: The payee name to search for
            threshold: Minimum similarity score (0-100)
            
        Returns:
            Tuple of (matched_payee, category, score) or None
        """
        # First try with original payee name
        normalized_input = payee_name.lower().strip()
        best_match = None
        best_score = 0
        
        for known_payee, category in self.mappings.items():
            score = fuzz.ratio(normalized_input, known_payee)
            if score >= threshold and score > best_score:
                best_score = score
                best_match = (known_payee, category, score)
        
        # If no match found, try with smart preprocessing
        if not best_match:
            preprocessed_input = self._normalize_payee_name(payee_name)
            
            for known_payee, category in self.mappings.items():
                # Also preprocess the known payee for comparison
                preprocessed_known = self._normalize_payee_name(known_payee)
                
                score = fuzz.ratio(preprocessed_input, preprocessed_known)
                if score >= threshold and score > best_score:
                    best_score = score
                    best_match = (known_payee, category, score)
        
        return best_match
    
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
            if normalized_payee in self.mappings:
                category = self.mappings.pop(normalized_payee)
                self._save_mappings()
                print(f"Removed mapping: '{payee_name}' → '{category}'")
                return True
            return False
        except Exception as e:
            print(f"Error removing mapping: {e}")
            return False
    
    def get_all_mappings(self) -> Dict[str, str]:
        """Get all current mappings."""
        return self.mappings.copy()
    
    def get_mappings_for_prompt(self) -> str:
        """
        Get mappings formatted for inclusion in AI prompts.
        
        Returns:
            Formatted string for prompt injection
        """
        if not self.mappings:
            return ""
        
        mapping_lines = []
        for payee, category in self.mappings.items():
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
            print(f"Learning opportunity: '{payee_name}' → '{category_name}'")
            return True
    
    def test_preprocessing(self, payee_name: str) -> str:
        """
        Test method to see how payee name preprocessing works.
        Useful for debugging and understanding matching behavior.
        """
        return self._normalize_payee_name(payee_name) 