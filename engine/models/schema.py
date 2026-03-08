from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any

@dataclass
class FlaggedFile:
    path: str
    match_percentage: str
    reason: str

@dataclass
class MatchedProject:
    project_id: str
    similarity_score: float
    matched_features: List[str]

@dataclass
class AnalysisResult:
    """
    UNIVERSAL RESPONSE SCHEMA — ProjectGuard Omega v2.0
    Multi-layer intelligence output with forensic-grade detail.
    This schema must remain stable across all LLM and Model upgrades.
    """
    engine_version: str = "v2.0.0-omega"
    analysis_mode: str = "Fast Mode"
    
    # ── Core Scores ──
    overall_risk_level: str = "PENDING"
    authenticity_score: float = 0.0
    similarity_score: float = 0.0
    structural_score: float = 0.0
    embedding_score: float = 0.0
    commit_risk_score: float = 0.0
    confidence_score: float = 0.0
    
    # ── Cognitive Metrics (Phases 1-6) ──
    viva_alignment_score: float = 0.0
    live_cognitive_score: float = 0.0
    metacognitive_score: float = 0.0
    skill_evolution_score: float = 0.0
    
    # ── Detailed Outputs ──
    flagged_files: List[FlaggedFile] = field(default_factory=list)
    matched_projects: List[MatchedProject] = field(default_factory=list)
    
    # ── LLM Generated Outputs ──
    summary: str = ""
    primary_finding: str = ""
    primary_flags: List[str] = field(default_factory=list)
    suggested_viva_questions: List[str] = field(default_factory=list)
    challenge_task: str = ""
    
    # ── Live Coding Challenge ──
    live_challenge: Optional[Dict[str, Any]] = None
    
    # ── AI Detection (Layer 4) ──
    ai_detection: Optional[Dict[str, Any]] = None
    
    # ── Code Quality & Documentation (Layers 8-11) ──
    code_quality: Optional[Dict[str, Any]] = None
    
    # ── Evidence Breakdown (all layers) ──
    evidence_breakdown: Optional[Dict[str, Any]] = None
    detected_issues: List[Dict[str, Any]] = field(default_factory=list)
    
    # ── Faculty & Student Reports ──
    faculty_report: str = ""
    student_message: str = ""
    recommendation: str = ""  # CLEAR_TO_PASS | REQUIRE_VIVA | REQUIRE_LIVE_CODING | RECOMMEND_REJECTION
    
    # ── External Web Evidence ──
    external_similarity_flag: bool = False
    external_source_candidates: List[str] = field(default_factory=list)
    matched_sources: List[Dict[str, Any]] = field(default_factory=list)
    
    # ── Context Data (Phases 1-2) ──
    repo_type: str = "Mixed Codebase"
    primary_language: str = "Unknown"

    # ── Telemetry ──
    processing_time_ms: int = 0
    token_usage_estimate: int = 0
    model_used: str = "Unknown"
    escalation_triggered: bool = False

    def to_dict(self) -> dict:
        return {
            "engine_version": self.engine_version,
            "analysis_mode": self.analysis_mode,
            "overall_risk_level": self.overall_risk_level,
            "authenticity_score": round(self.authenticity_score, 1),
            "similarity_score": round(self.similarity_score, 2),
            "structural_score": round(self.structural_score, 2),
            "embedding_score": round(self.embedding_score, 2),
            "commit_risk_score": round(self.commit_risk_score, 2),
            "confidence_score": round(self.confidence_score, 2),
            
            "cognitive_metrics": {
                "viva_alignment": self.viva_alignment_score,
                "live_cognitive": self.live_cognitive_score,
                "metacognitive": self.metacognitive_score,
                "skill_evolution": self.skill_evolution_score
            },
            
            "summary": self.summary,
            "primary_finding": self.primary_finding,
            "primary_flags": self.primary_flags,
            "suggested_viva_questions": self.suggested_viva_questions,
            "challenge_task": self.challenge_task,
            "recommendation": self.recommendation,
            
            "live_challenge": self.live_challenge,
            "ai_detection": self.ai_detection,
            "code_quality": self.code_quality,
            "evidence_breakdown": self.evidence_breakdown,
            "detected_issues": self.detected_issues,
            
            "faculty_report": self.faculty_report,
            "student_message": self.student_message,

            "external_similarity_flag": self.external_similarity_flag,
            "external_source_candidates": self.external_source_candidates,
            "matched_sources": self.matched_sources,
            
            "flagged_files": [vars(f) for f in self.flagged_files],
            "matched_projects": [vars(m) for m in self.matched_projects],
            
            "repo_type": self.repo_type,
            "primary_language": self.primary_language,

            "processing_time_ms": self.processing_time_ms,
            "token_usage_estimate": self.token_usage_estimate,
            "model_used": self.model_used,
            "escalation_triggered": self.escalation_triggered
        }
