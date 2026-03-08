import hashlib

class Hashing:
    """
    Utility for generating secure DNA fingerprints for files and entire projects.
    """
    
    @staticmethod
    def generate_sha256(content: str) -> str:
        """Centralized hash function for consistent DNA generation."""
        sha = hashlib.sha256()
        sha.update(content.encode('utf-8'))
        return sha.hexdigest()

    @staticmethod
    def hash_commutative(hashes: list) -> str:
        """
        Takes a list of file hashes and XORs them. 
        Order does not matter!
        This is critical for detecting when a student merely reorders files in a directory.
        """
        result = 0
        for h in hashes:
            result ^= int(h, 16)
        
        if result == 0:
            return ""
            
        return format(result, 'x')
