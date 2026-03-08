"""
LANGUAGE DETECTION ENGINE — Phase 2
languageAnalyzer.py

Scans repository and computes language distribution.
Detects main language and enables multi-language interrogation.
"""

from typing import Dict, Any, List
from collections import Counter

class LanguageAnalyzer:
    def __init__(self):
        self.extensions = {
            '.py': 'Python',
            '.js': 'JavaScript',
            '.jsx': 'React (JavaScript)',
            '.ts': 'TypeScript',
            '.tsx': 'React (TypeScript)',
            '.java': 'Java',
            '.cpp': 'C++',
            '.c': 'C',
            '.cs': 'C#',
            '.go': 'Go',
            '.rs': 'Rust',
            '.rb': 'Ruby',
            '.php': 'PHP',
            '.html': 'HTML',
            '.css': 'CSS',
            '.sh': 'Shell',
        }

    def analyze(self, files: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Takes a list of files with 'path' and 'content' keys.
        Computes line counts per language and percentages.
        """
        lang_counts = Counter()
        total_lines = 0

        for file in files:
            path = file.get('path', '')
            content = file.get('content', '')
            ext = path[path.rfind('.'):] if '.' in path else ''

            if ext in self.extensions:
                lang = self.extensions[ext]
                lines = content.count('\n') + 1
                lang_counts[lang] += lines
                total_lines += lines

        if total_lines == 0:
            return {
                "distribution": {},
                "primary_language": "Unknown",
                "is_multi_language": False
            }

        distribution = {}
        for lang, count in lang_counts.items():
            distribution[lang] = round((count / total_lines) * 100, 1)

        sorted_langs = sorted(distribution.items(), key=lambda x: x[1], reverse=True)
        primary = sorted_langs[0][0] if sorted_langs else "Unknown"

        return {
            "distribution": distribution,
            "primary_language": primary,
            "sorted_languages": [lang for lang, pct in sorted_langs],
            "is_multi_language": len([l for l, pct in sorted_langs if pct > 10.0]) > 1
        }
