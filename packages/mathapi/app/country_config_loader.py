import json
import os
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class CountryConfigLoader:
    """
    Loads and manages country-specific configuration for payee name preprocessing.
    Supports multiple countries and banks with flexible pattern matching.
    """
    
    def __init__(self, config_file: str = None):
        if config_file is None:
            # Default to the config file in the same directory
            current_dir = os.path.dirname(os.path.abspath(__file__))
            config_file = os.path.join(current_dir, 'country_configs', 'country_patterns.json')
        
        self.config_file = config_file
        self._config = None
        self._load_config()
    
    def _load_config(self):
        """Load configuration from JSON file with better error handling."""
        try:
            with open(self.config_file, 'r', encoding='utf-8') as f:
                self._config = json.load(f)
            logger.debug(f"Loaded country config from {self.config_file}")
            
            # Validate essential structure
            if not self._config.get('countries'):
                raise ValueError("Config missing 'countries' section")
            if not self._config.get('default_country'):
                raise ValueError("Config missing 'default_country'")
                
        except FileNotFoundError:
            logger.error(f"Config file not found: {self.config_file}")
            logger.info("Attempting to create default config file...")
            self._create_default_config_file()
            self._config = self._get_fallback_config()
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in config file: {e}")
            logger.info("Please check the JSON syntax in the config file")
            self._config = self._get_fallback_config()
            
        except ValueError as e:
            logger.error(f"Invalid config structure: {e}")
            self._config = self._get_fallback_config()
            
        except Exception as e:
            logger.error(f"Unexpected error loading config: {e}")
            self._config = self._get_fallback_config()
    
    def _create_default_config_file(self):
        """Create a default config file from template if it doesn't exist."""
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(self.config_file), exist_ok=True)
            
            # Try to load default config template
            current_dir = os.path.dirname(os.path.abspath(__file__))
            default_template_file = os.path.join(current_dir, 'country_configs', 'default_config.json')
            
            try:
                with open(default_template_file, 'r', encoding='utf-8') as f:
                    default_config = json.load(f)
                
                logger.info("Loaded default config from template file")
                
            except Exception as e:
                logger.warning(f"Could not load default template: {e}")
                
                # Fallback to minimal config as template
                minimal_config_file = os.path.join(current_dir, 'country_configs', 'minimal_config.json')
                try:
                    with open(minimal_config_file, 'r', encoding='utf-8') as f:
                        default_config = json.load(f)
                    
                    logger.info("Using minimal config as default template")
                    
                except Exception as e2:
                    logger.error(f"Could not load any config template: {e2}")
                    raise Exception("No config templates available")
            
            # Write the config file
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(default_config, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Created default config file: {self.config_file}")
            
        except Exception as e:
            logger.error(f"Could not create default config file: {e}")
            logger.info("Please manually create the config file or check file permissions")
    
    def is_config_loaded_successfully(self) -> bool:
        """Check if the configuration was loaded successfully from file."""
        return (
            self._config is not None and 
            len(self._config.get('countries', {})) > 1  # More than just fallback
        )
    
    def _get_fallback_config(self) -> Dict:
        """
        Load minimal fallback configuration from JSON file.
        If that also fails, return absolute minimum to prevent crashes.
        """
        logger.warning("Loading minimal fallback configuration")
        
        try:
            # Try to load minimal config from JSON file
            current_dir = os.path.dirname(os.path.abspath(__file__))
            minimal_config_file = os.path.join(current_dir, 'country_configs', 'minimal_config.json')
            
            with open(minimal_config_file, 'r', encoding='utf-8') as f:
                minimal_config = json.load(f)
            
            logger.info("Loaded minimal fallback config from JSON file")
            return minimal_config
            
        except Exception as e:
            logger.error(f"Could not load minimal config file: {e}")
            logger.critical("All config loading methods failed - using emergency fallback")
            
            # Emergency fallback - absolute minimum structure to prevent crashes
            return {
                "default_country": "BE",
                "countries": {"BE": {"name": "Belgium", "bank_patterns": {}, "cities": [], "business_suffixes": [], "location_words": []}},
                "global_patterns": {"common_business_suffixes": [], "common_location_words": [], "number_patterns": []}
            }
    
    def get_country_config(self, country_code: str = None) -> Dict:
        """
        Get configuration for a specific country.
        
        Args:
            country_code: ISO country code (e.g., 'BE', 'NL', 'US')
                         If None, uses default country
        
        Returns:
            Country configuration dictionary
        """
        if country_code is None:
            country_code = self.get_default_country()
        
        country_code = country_code.upper()
        
        if country_code in self._config.get('countries', {}):
            return self._config['countries'][country_code]
        else:
            logger.warning(f"Country {country_code} not found, using default")
            default_country = self.get_default_country()
            return self._config['countries'].get(default_country, {})
    
    def get_default_country(self) -> str:
        """Get the default country code."""
        return self._config.get('default_country', 'BE')
    
    def get_global_patterns(self) -> Dict:
        """Get global patterns that apply to all countries."""
        return self._config.get('global_patterns', {})
    
    def get_all_bank_indicators(self, country_code: str = None) -> List[str]:
        """
        Get all bank transaction indicators for a country.
        
        Returns:
            List of transaction indicator strings
        """
        country_config = self.get_country_config(country_code)
        indicators = []
        
        for bank_name, bank_config in country_config.get('bank_patterns', {}).items():
            indicators.extend(bank_config.get('transaction_indicators', []))
        
        return list(set(indicators))  # Remove duplicates
    
    def get_all_bank_prefixes(self, country_code: str = None) -> List[str]:
        """Get all bank prefixes for a country."""
        country_config = self.get_country_config(country_code)
        prefixes = []
        
        for bank_name, bank_config in country_config.get('bank_patterns', {}).items():
            prefixes.extend(bank_config.get('prefixes', []))
        
        return list(set(prefixes))  # Remove duplicates
    
    def get_all_split_patterns(self, country_code: str = None) -> List[str]:
        """Get all split patterns for a country."""
        country_config = self.get_country_config(country_code)
        patterns = []
        
        for bank_name, bank_config in country_config.get('bank_patterns', {}).items():
            patterns.extend(bank_config.get('split_patterns', []))
        
        return list(set(patterns))  # Remove duplicates
    
    def detect_country_from_payee(self, payee_name: str) -> str:
        """
        Try to detect country from payee name based on indicators.
        
        Args:
            payee_name: The payee name to analyze
            
        Returns:
            Detected country code or default country
        """
        payee_lower = payee_name.lower()
        
        # Check each country's indicators, prioritizing prefixes and country codes
        detection_scores = {}
        
        for country_code, country_config in self._config.get('countries', {}).items():
            score = 0
            
            # Check bank transaction indicators and prefixes
            for bank_name, bank_config in country_config.get('bank_patterns', {}).items():
                
                # High score for bank prefixes (most reliable)
                for prefix in bank_config.get('prefixes', []):
                    if payee_lower.startswith(prefix):
                        score += 100
                        logger.debug(f"Found {country_code} prefix '{prefix}' in '{payee_name[:30]}'")
                
                # Medium score for country code patterns (very reliable)
                country_pattern = bank_config.get('country_code_pattern', '')
                if country_pattern:
                    import re
                    if re.search(country_pattern, payee_lower):
                        score += 80
                        logger.debug(f"Found {country_code} country code pattern in '{payee_name[:30]}'")
                
                # Lower score for transaction indicators (less specific)
                for indicator in bank_config.get('transaction_indicators', []):
                    if indicator in payee_lower:
                        score += 20
                        logger.debug(f"Found {country_code} indicator '{indicator}' in '{payee_name[:30]}'")
            
            # Small bonus for matching cities (weakest signal)
            cities = country_config.get('cities', [])
            for city in cities:
                if city in payee_lower:
                    score += 5
                    logger.debug(f"Found {country_code} city '{city}' in '{payee_name[:30]}'")
            
            if score > 0:
                detection_scores[country_code] = score
        
        # Return country with highest score
        if detection_scores:
            best_country = max(detection_scores.items(), key=lambda x: x[1])
            logger.debug(f"Best detection: {best_country[0]} (score: {best_country[1]})")
            return best_country[0]
        
        # Fallback to default
        logger.debug(f"No country detected for '{payee_name[:30]}', using default")
        return self.get_default_country()
    
    def get_available_countries(self) -> List[Dict]:
        """Get list of all available countries with their names."""
        countries = []
        for code, config in self._config.get('countries', {}).items():
            countries.append({
                'code': code,
                'name': config.get('name', code)
            })
        return countries
    
    def reload_config(self):
        """Reload configuration from file."""
        self._load_config()


# Global instance for easy access
_config_loader = None

def get_config_loader() -> CountryConfigLoader:
    """Get the global configuration loader instance."""
    global _config_loader
    if _config_loader is None:
        _config_loader = CountryConfigLoader()
    return _config_loader 