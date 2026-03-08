import re

class ExplanationProcessor:
    def process(self, text: str) -> dict:
        """
        Detects quality as per mission PHASE 3 STEP 4.
        """
        text_lower = text.lower()
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text_lower)
        
        # 1. Detect Specific References (Files, Functions, Variables)
        # Assuming common naming patterns
        specific_refs = re.findall(r'\b[a-z]+[A-Z][a-z]+\b|\b[a-z]+_[a-z]+\b|\.js|\.py|\.ts|\bmain\b', text)
        ref_score = min(1.0, len(specific_refs) / 3.0)

        # 2. Detect Trade-off Discussions / Failure Awareness
        trade_off_keywords = ['choose', 'instead', 'better', 'performance', 'limitation', 'tried', 'switch', 'reason']
        trade_off_hits = [w for w in trade_off_keywords if w in text_lower]
        logic_score = min(1.0, len(trade_off_hits) / 2.0)

        # 3. Detect Generic/Wikipedia-style (shallow filler or copy-paste style)
        generic_phrases = ['i used this for', 'code does this', 'standard way to', 'this is a']
        generic_hits = [p for p in generic_phrases if p in text_lower]
        
        is_generic = len(words) < 15 or len(generic_hits) > 1
        
        # Quality calculation
        quality_score = (ref_score * 0.4) + (logic_score * 0.4) + ((0.0 if is_generic else 1.0) * 0.2)
        
        quality_label = "HIGH" if quality_score > 0.7 else ("MEDIUM" if quality_score > 0.4 else "LOW")
        
        return {
            "quality_score": round(quality_score, 2),
            "quality_label": quality_label,
            "has_specific_refs": len(specific_refs) > 0,
            "discusses_tradeoffs": len(trade_off_hits) > 0,
            "is_generic_or_shallow": is_generic,
            "word_count": len(words)
        }
