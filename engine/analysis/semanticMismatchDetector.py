from .codeSemanticExtractor import CodeSemanticExtractor
from .explanationProcessor import ExplanationProcessor
from .embeddingEngine import EmbeddingEngine
from .semanticMatcher import SemanticMatcher
from .specificityAnalyzer import SpecificityAnalyzer

class SemanticMismatchDetector:
    def __init__(self):
        self.code_extractor = CodeSemanticExtractor()
        self.exp_processor = ExplanationProcessor()
        self.embedder = EmbeddingEngine()
        self.matcher = SemanticMatcher()
        self.spec_analyzer = SpecificityAnalyzer()

    def analyze(self, code: str, explanation: str, language: str = "javascript") -> dict:
        """
        Combines semantic similarity and implementation specificity to determine authorship understanding.
        As per PHASE 3 STEP 3 Logic.
        """
        # 1. Extract semantic summary from code
        code_summary = self.code_extractor.extract_semantics(code, language)
        
        # 2. Process student explanation (PHASE 3 STEP 4: Quality & Meta-context)
        exp_metrics = self.exp_processor.process(explanation)
        
        # 3. Embeddings (PHASE 3 STEP 1/3)
        code_embed = self.embedder.embed(code_summary)
        exp_embed = self.embedder.embed(explanation)
        
        # 4. Cosine Similarity (PHASE 3 STEP 3)
        sim_score = self.matcher.compute_similarity(code_embed, exp_embed)
        
        # 5. Specificity Overlap
        spec_score = self.spec_analyzer.analyze(code_summary, explanation)
        
        # 6. Final Understanding Fusion
        # weighting similarity high, but penalized by low quality explanations
        raw_final = (0.6 * sim_score) + (0.4 * spec_score)
        
        # Apply Quality Penalty (PHASE 3 STEP 4)
        if exp_metrics["quality_label"] == "LOW":
            raw_final *= 0.6 # -40% for generic/wikipedia style
        elif exp_metrics["quality_label"] == "MEDIUM":
            raw_final *= 0.85
            
        match_percentage = int(raw_final * 100)
        
        # Verdict logic (PHASE 3 STEP 3 Categories)
        if match_percentage >= 80:
            verdict = "DEEP_UNDERSTANDING"
            reason = "Explanation deeply aligns with implementation decisions and specific code DNA."
        elif match_percentage >= 50:
            verdict = "SURFACE_UNDERSTANDING"
            reason = "Explanation matches general concepts but lacks connection to micro-decisions."
        else:
            verdict = "NO_UNDERSTANDING"
            reason = "Likely did not write the code. Explanation contradicts or misses core implementation rationale."

        return {
            "authenticity_score": match_percentage,
            "verdict": verdict,
            "semantic_consciousness": round(sim_score, 2),
            "implementation_specificity": round(spec_score, 2),
            "explanation_quality": exp_metrics["quality_label"],
            "has_specific_references": exp_metrics["has_specific_refs"],
            "reason": reason
        }
