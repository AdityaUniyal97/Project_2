"""
CODE SEGMENT CONTEXT EXTRACTION — Phase 5
codeContextExtractor.py

Extracts function definitions, detects algorithm patterns,
and identifies key logic blocks before generating questions.
"""

from typing import Dict, Any, List
import re

class CodeContextExtractor:
    def __init__(self):
        pass

    def extract_context(self, code: str, language: str) -> Dict[str, Any]:
        """
        Parses code based on language to extract functions, classes, and logic blocks.
        """
        context = {
            "functions": [],
            "classes": [],
            "algorithms": [],
            "key_variables": []
        }

        if language == "Python":
            context["functions"] = re.findall(r'def\s+([a-zA-Z_0-9]+)\s*\(', code)
            context["classes"] = re.findall(r'class\s+([a-zA-Z_0-9]+)\s*[:\(]', code)
            
        elif language in ["JavaScript", "TypeScript", "React (JavaScript)", "React (TypeScript)"]:
            context["functions"] = re.findall(r'function\s+([a-zA-Z_0-9]+)\s*\(', code)
            context["functions"] += re.findall(r'(?:const|let|var)\s+([a-zA-Z_0-9]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z_0-9]+)\s*=>', code)
            context["classes"] = re.findall(r'class\s+([a-zA-Z_0-9]+)\s*(?:extends\s*[a-zA-Z_0-9]+)?\s*\{', code)
            
        elif language == "Java":
            context["functions"] = re.findall(r'(?:public|private|protected|static|final|\s)*\s+[\w\<\>\[\]]+\s+([a-zA-Z_0-9]+)\s*\([^)]*\)\s*(?:throws\s+[a-zA-Z_0-9,\s]+)?\s*\{', code)
            context["classes"] = re.findall(r'class\s+([a-zA-Z_0-9]+)\s*', code)
            
        elif language == "C++":
            context["functions"] = re.findall(r'(?:virtual|static|inline|const|\s)*\s+[\w\<\>\[\]\*\&]+\s+([a-zA-Z_0-9]+)\s*\([^)]*\)\s*(?:const)?\s*\{', code)
            context["classes"] = re.findall(r'class\s+([a-zA-Z_0-9]+)\s*', code)
        
        # Cross-language Algorithm Patterns
        if re.search(r'\b(dp|memo|cache)\b', code.lower()):
            context["algorithms"].append("Dynamic Programming / Memoization")
        if re.search(r'\b(dfs|bfs|traverse|visit)\b', code.lower()):
            context["algorithms"].append("Graph / Tree Traversal")
        if re.search(r'\b(left|right|start|end|low|high)\b.*\b(while|for)\b', code.lower()):
            context["algorithms"].append("Two Pointers / Sliding Window")
        if re.search(r'\b(sort|sorted)\b', code.lower()):
            context["algorithms"].append("Sorting")
        if "hashmap" in code.lower() or "new map()" in code.lower() or "{}" in code:
            context["algorithms"].append("Hash Map Lookup")
        if "fetch" in code or "axios" in code:
            context["algorithms"].append("Async API Fetch")
        if "useeffect" in code.lower() or "usestate" in code.lower():
            context["algorithms"].append("React State Management")
            
        return context
