"""
PHASE 7 — FINAL VERDICT SYNTHESIS
verdictEngine.py

The ultimate authenticity aggregator. Uses Bayesian Inference to fuse 
multi-dimensional cognitive signals into a final authenticity oracle.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
import math

@dataclass
class CognitiveSignals:
    semantic_consciousness: float = 0.5  # Phase 1: Explanation vs Code (0-1)
    temporal_skill: float = 0.5         # Phase 2: Commit Evolution (0-1)
    adversarial_consensus: float = 0.5   # Phase 3: Agent Interrogation (0-1)
    live_cognitive: float = 0.5          # Phase 4: Keystroke Telemetry (0-1)
    cross_repo: float = 0.5              # Phase 5: Global Similarity (0-1, inverted)
    metacognitive_debug: float = 0.5     # Phase 6: Bug Fix Performance (0-1)

class VerdictEngine:
    MISSION_WEIGHTS = {
        "semantic_consciousness": 0.30,
        "temporal_skill": 0.20,
        "adversarial_consensus": 0.20,
        "live_cognitive": 0.15,
        "cross_repo": 0.10,
        "metacognitive_debug": 0.05
    }

    def compute_verdict(self, signals: CognitiveSignals, repo_analysis: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Aggregates multi-dimensional intelligence using Bayesian logic.
        """
        # 0. Global Rejection Check (Phase 1)
        if repo_analysis and repo_analysis.get("verdict") == "REJECTED":
            return {
                "authenticity_score": 0.0,
                "confidence_interval": "100%",
                "verdict": "REJECTED",
                "verdict_label": "Submission Denied",
                "risk_level": "CRITICAL",
                "evidence_report": [f"REJECTION: {repo_analysis.get('reason', 'Invalid repository context')}"],
                "recommendation": "REJECT",
                "dimension_scores": {
                    "thought_code_alignment": 0,
                    "skill_trajectory": 0,
                    "adversarial_resilience": 0,
                    "behavioral_dna": 0
                }
            }

        # 1. Classical Weighted Score
        weighted_score = (
            signals.semantic_consciousness * self.MISSION_WEIGHTS["semantic_consciousness"] +
            signals.temporal_skill * self.MISSION_WEIGHTS["temporal_skill"] +
            signals.adversarial_consensus * self.MISSION_WEIGHTS["adversarial_consensus"] +
            signals.live_cognitive * self.MISSION_WEIGHTS["live_cognitive"] +
            (1.0 - signals.cross_repo) * self.MISSION_WEIGHTS["cross_repo"] + # Inverted
            signals.metacognitive_debug * self.MISSION_WEIGHTS["metacognitive_debug"]
        )

        # 2. Bayesian Authenticity Probability
        # P(Authentic | Evidence)
        prior = 0.5
        odds_prior = prior / (1 - prior)

        def get_lr(val, weight):
            # Sigmoid-based likelihood ratio
            eps = 0.01
            prob = max(eps, min(1.0 - eps, val))
            lr = (prob / (1 - prob)) ** (weight * 2.5) # Stronger weight influence
            return lr

        lr_total = (
            get_lr(signals.semantic_consciousness, self.MISSION_WEIGHTS["semantic_consciousness"]) *
            get_lr(signals.temporal_skill, self.MISSION_WEIGHTS["temporal_skill"]) *
            get_lr(signals.adversarial_consensus, self.MISSION_WEIGHTS["adversarial_consensus"]) *
            get_lr(signals.live_cognitive, self.MISSION_WEIGHTS["live_cognitive"]) *
            get_lr(1.0 - signals.cross_repo, self.MISSION_WEIGHTS["cross_repo"]) *
            get_lr(signals.metacognitive_debug, self.MISSION_WEIGHTS["metacognitive_debug"])
        )

        posterior_odds = odds_prior * lr_total
        authenticity_prob = posterior_odds / (1 + posterior_odds)
        
        # Scale to 0-100
        final_score = round(authenticity_prob * 100, 1)

        # Verdict Classification (Strict Triage)
        if final_score >= 88:
            verdict = "VERIFIED"
            label = "Authentic Mind-Code Alignment"
            risk = "LOW"
        elif final_score >= 65:
            verdict = "SUSPICIOUS"
            label = "Cognitive Gap Detected (Potential AI Assistance)"
            risk = "MEDIUM"
        elif final_score >= 40:
            verdict = "HIGH_RISK"
            label = "Disconnected Mental Model"
            risk = "HIGH"
        else:
            verdict = "CRITICAL"
            label = "High Probability of Fraud (Inhuman DNA)"
            risk = "CRITICAL"

        evidence = self._generate_evidence(signals, final_score)

        return {
            "authenticity_score": final_score,
            "confidence_interval": f"±{round((100 - abs(50 - final_score)) / 10, 1)}%",
            "verdict": verdict,
            "verdict_label": label,
            "risk_level": risk,
            "evidence_report": evidence,
            "recommendation": "APPROVE" if verdict == "VERIFIED" else ("REQUIRE_VIVA" if verdict == "SUSPICIOUS" else "REQUIRE_LIVE_CODING"),
            "dimension_scores": {
                "thought_code_alignment": round(signals.semantic_consciousness * 100, 1),
                "skill_trajectory": round(signals.temporal_skill * 100, 1),
                "adversarial_resilience": round(signals.adversarial_consensus * 100, 1),
                "behavioral_dna": round(signals.live_cognitive * 100, 1)
            }
        }

    def _generate_evidence(self, s: CognitiveSignals, score: float) -> List[str]:
        repo = []
        if s.semantic_consciousness < 0.35:
            repo.append("CRITICAL: Student explanation contradicts code implementation semantics.")
        elif s.semantic_consciousness < 0.6:
            repo.append("SURFACE: Student lacks awareness of their own micro-decisions.")

        if s.temporal_skill < 0.4:
            repo.append("TRAJECTORY: Impossible skill jump detected in Git history.")
        
        if s.live_cognitive < 0.45:
            repo.append("BEHAVIOR: Live coding telemetry shows robotic/AI-like velocity.")
            
        if s.cross_repo > 0.65:
            repo.append("SIMILARITY: Large code blocks found in public repositories/plagiarism network.")
            
        if s.adversarial_consensus < 0.3:
            repo.append("ADVERSARIAL: Student failed to defend their implementation against trap questions.")
            
        if not repo:
            repo.append("Cognitive fingerprint remains consistent with human architectural development.")
        
        return repo

