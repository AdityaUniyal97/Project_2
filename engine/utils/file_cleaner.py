import re

class FileCleaner:
    """
    Utility for filtering and normalizing source code files.
    Extracts the logic and throws away formatting and comments.
    """
    
    SUPPORTED_EXTENSIONS = {
        '.py', '.js', '.ts', '.java', '.cpp', '.c', 
        '.html', '.css', '.tsx', '.jsx'
    }

    IGNORE_DIRS = {
        'node_modules', '.git', 'venv', 'env', '__pycache__', 
        'build', 'dist', 'target', '.next', 'out'
    }

    @classmethod
    def is_valid_file(cls, path: str, size_bytes: int) -> bool:
        """Determines if a file should be parsed."""
        if any(ignored in path for ignored in cls.IGNORE_DIRS):
            return False
            
        # Ignore files that are too big (1MB max to save memory)
        if size_bytes > 1_000_000:
            return False
            
        return any(path.endswith(ext) for ext in cls.SUPPORTED_EXTENSIONS)

    @classmethod
    def clean_code(cls, content: str, extension: str) -> str:
        """
        Removes comments and whitespace to extract pure logical tokens.
        """
        # Remove comments based on language
        if extension in ['.py']:
            content = re.sub(r'#.*', '', content)
            content = re.sub(r'\'\'\'.*?\'\'\'', '', content, flags=re.DOTALL)
            content = re.sub(r'\"\"\".*?\"\"\"', '', content, flags=re.DOTALL)
        elif extension in ['.js', '.ts', '.java', '.cpp', '.c', '.tsx', '.jsx']:
            content = re.sub(r'//.*', '', content)
            content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)

        # Normalize whitespace (removes newlines, multiple spaces, tabs)
        content = re.sub(r'\s+', '', content)
        
        # Lowercase everything (variable renaming defense)
        return content.lower()
