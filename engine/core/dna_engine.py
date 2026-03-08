import os
import re
import hashlib
from typing import Dict, List, Set, Tuple, Optional

class CodeDNAEngine:
    """
    Upgraded Layer 1: Multi-Granularity Code DNA Engine.
    Handles file-level and function-level hashing, size thresholds, 
    and collision-safe hash mapping.
    """

    def __init__(self, 
                 supported_extensions: Set[str] = {'.py', '.js', '.ts', '.java', '.cpp', '.c'},
                 min_file_size: int = 50,
                 max_file_size: int = 1_000_000):
        self.supported_extensions = supported_extensions
        self.min_file_size = min_file_size
        self.max_file_size = max_file_size
        self.ignore_folders = {
            'node_modules', 'venv', '.git', '__pycache__', 
            'dist', 'build', '.next', 'target', '.idea', '.vscode'
        }

    def _clean_code(self, content: str, extension: str) -> str:
        """Removes comments and normalizes code to its logical core."""
        if extension in {'.py'}:
            # Remove triple quoted strings
            content = re.sub(r'(""".*?"""|\'\'\'.*?\'\'\')', '', content, flags=re.DOTALL)
            # Remove single line comments
            content = re.sub(r'#.*', '', content)
        elif extension in {'.js', '.ts', '.java', '.cpp', '.c'}:
            # Remove multi-line comments
            content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
            # Remove single line comments
            content = re.sub(r'//.*', '', content)

        # Normalize whitespace
        content = re.sub(r'\s+', ' ', content).strip()
        return content.lower()

    def _extract_functions(self, clean_content: str, extension: str) -> List[Dict]:
        """
        Layer 1 Heuristic: Extracts logical blocks based on common keywords.
        """
        functions = []
        # Basic regex for functions
        pattern = r'(?:def|function|class)\s+([a-zA-Z_]\w*)'
        matches = list(re.finditer(pattern, clean_content))
        
        split_indices = [m.start() for m in matches]
        split_indices.append(len(clean_content))
        
        for i, match in enumerate(matches):
            name = match.group(1)
            block = clean_content[split_indices[i]:split_indices[i+1]]
            if len(block) > 30: # Only hash meaningful blocks
                functions.append({
                    "name": name,
                    "hash": hashlib.sha256(block.encode()).hexdigest(),
                    "size": len(block)
                })
        return functions

    def process_project(self, project_path: str) -> Dict:
        """Generates Multi-Granularity DNA of the project."""
        dna = {
            "project_name": os.path.basename(project_path),
            "project_signature": "",
            "total_files": 0,
            "files": [],
            "hash_report": {} 
        }

        all_file_hashes = []

        for root, dirs, files in os.walk(project_path):
            dirs[:] = [d for d in dirs if d not in self.ignore_folders]

            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in self.supported_extensions:
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            raw = f.read()
                        
                        clean = self._clean_code(raw, ext)
                        if len(clean) < self.min_file_size or len(clean) > self.max_file_size:
                            continue

                        file_hash = hashlib.sha256(clean.encode()).hexdigest()
                        rel_path = os.path.relpath(file_path, project_path)

                        if file_hash not in dna["hash_report"]:
                            dna["hash_report"][file_hash] = []
                        dna["hash_report"][file_hash].append(rel_path)

                        dna["files"].append({
                            "path": rel_path,
                            "hash": file_hash,
                            "size": len(clean),
                            "functions": self._extract_functions(clean, ext)
                        })
                        all_file_hashes.append(file_hash)
                        dna["total_files"] += 1

                    except Exception as e:
                        print(f"Error processing {file}: {e}")

        if all_file_hashes:
            all_file_hashes.sort()
            dna["project_signature"] = hashlib.sha256("".join(all_file_hashes).encode()).hexdigest()

        return dna
