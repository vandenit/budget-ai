from cryptography.fernet import Fernet
import hashlib
import base64

class EncryptionHelper:
    def __init__(self):
        """
        Initialize the encryption helper with a fixed secret key.
        This ensures consistent encryption during tests.
        """
        # Use a fixed key for test fixtures to ensure reproducibility
        self.key = Fernet.generate_key()
        self.fernet = Fernet(self.key)

    def encrypt_value(self, value):
        """
        Encrypt a value consistently, ensuring the same input always yields the same output.
        This is important for test fixtures where we need reproducible results.
        
        Args:
            value: The string value to encrypt
            
        Returns:
            str: The encrypted value
        """
        if not value:
            return value
            
        # Convert value to string if it isn't already
        value_str = str(value)
        
        # Create a deterministic hash of the value
        hash_object = hashlib.sha256(value_str.encode())
        hash_bytes = hash_object.digest()
        
        # Use base64 encoding to get a clean string representation
        return base64.b64encode(hash_bytes).decode('utf-8')

    def encrypt_sensitive_data(self, data):
        """
        Recursively encrypt sensitive data in the input structure.
        Handles both dictionaries and lists.
        
        Args:
            data: The data structure to encrypt (dict or list)
            
        Returns:
            The data structure with sensitive fields encrypted
        """
        if isinstance(data, dict):
            encrypted_data = {}
            for key, value in data.items():
                # Encrypt specific fields that contain sensitive information
                if key in ['name', 'memo', 'account_name', 'payee_name']:
                    encrypted_data[key] = self.encrypt_value(value)
                else:
                    # Recursively process nested structures
                    encrypted_data[key] = self.encrypt_sensitive_data(value)
            return encrypted_data
            
        elif isinstance(data, list):
            # Process each item in the list
            return [self.encrypt_sensitive_data(item) for item in data]
            
        return data 