import re

class SpecificityAnalyzer:
    def analyze(self, code_text: str, explanation: str) -> float:
        """
        Check if the explanation contains specific implementation details
        found in the code.
        """
        exp_words = set(re.findall(r'\b[a-zA-Z]{4,}\b', explanation.lower()))
        code_words = set(re.findall(r'\b[a-zA-Z]{4,}\b', code_text.lower()))
        
        # Intersection of words longer than 3 chars
        overlap = exp_words.intersection(code_words)
        
        # Score based on how many code specific words were used in explanation
        score = 0
        if len(overlap) > 5:
            score = 100
        elif len(overlap) > 3:
            score = 75
        elif len(overlap) > 1:
            score = 40
            
        return score / 100.0
