import json
import logging
from typing import Dict, Any
from engine.agents.base_agent import BaseAgent
from engine.llm.provider import LLMProvider
from engine.models.schema import AnalysisResult, MatchedProject

logger = logging.getLogger(__name__)

class VerdictAgent(BaseAgent):
    """
    Agent 5: AI Verdict Agent (The Synthesizer)
    Takes raw signals and generates the final academic verdict strictly conforming to the Universal Schema.
    """
    def __init__(self, llm_provider: LLMProvider):
        super().__init__(name="Verdict")
        self.llm = llm_provider

    def analyze(self, signals: Dict[str, Any]) -> AnalysisResult:
        """
        Processes multi-agent signals into a single structured verdict safely.
        """
        # 1. Validation to prevent TypeError (None checking before parsing)
        if not signals:
            logger.warning("[VerdictAgent] Received entirely empty signals payload.")
            signals = {}
            
        repo_context = str(signals.get("repo_context", {}))
        lang_dist = str(signals.get("language_distribution", {}))
        
        system_prompt = self._build_system_prompt(repo_context=f"RepoType: {repo_context}\nLanguages: {lang_dist}")
        user_prompt = self._build_user_prompt(signals)
        
        # 2. Extract Threshold variables for Model Escalation cleanly
        sim_data = signals.get("similarity", {})
        commit_data = signals.get("commits", {})
        
        # Safely extract score regardless of if it's a Pydantic Dict or Object mapping
        sim_score = sim_data.get("file_overlap_percentage", 0.0) if isinstance(sim_data, dict) else getattr(sim_data, "file_overlap_percentage", 0.0)
        commit_risk = commit_data.get("commit_risk_score", 0.0) if isinstance(commit_data, dict) else getattr(commit_data, "commit_risk_score", 0.0)
        
        # Determine strict escalation logic based on threshold parameters mapped by Orchestrator's execution
        analysis_mode = signals.get("analysis_mode", "Fast Mode")
        use_deep_model = (float(sim_score) > 0.4 or float(commit_risk) > 0.7) and (analysis_mode == "Deep Mode")
        
        # 3. Request LLM Synthesis (Single-Shot call, provider dictates execution)
        llm_json, tokens_burned, model_used = self.llm.generate_json_response(
            system_prompt=system_prompt, 
            user_payload=user_prompt, 
            use_advanced_model=use_deep_model
        )
        
        # 4. Integrate Bayesian VerdictEngine (Mathematical DNA)
        from engine.core.verdictEngine import VerdictEngine, CognitiveSignals
        ve = VerdictEngine()
        
        # Normalize signals for the Bayesian Engine (PHASE 8)
        cog_signals = CognitiveSignals(
            semantic_consciousness=signals.get("viva_alignment_score", 0.5),
            temporal_skill=signals.get("skill_evolution_score", 0.5), # From upgraded CommitAnalyzer
            adversarial_consensus=signals.get("adversarial_consensus", 0.7), 
            live_cognitive=signals.get("live_cognitive_score", 0.6), 
            cross_repo=float(sim_score),
            metacognitive_debug=signals.get("metacognitive_score", 0.5)
        )
        
        # Context Mapping
        rc = signals.get("repo_context", {})
        ld = signals.get("language_distribution", {})

        # Pass repo_context to handle global rejection (Phase 1 STEP 1)
        bayesian_result = ve.compute_verdict(cog_signals, repo_analysis=rc)
        
        # 5. Map back to Universal Schema with strictly typed fallbacks
        result = AnalysisResult()
        
        result.repo_type = rc.get("repo_type", "Mixed Codebase") if isinstance(rc, dict) else "Mixed Codebase"
        result.primary_language = ld.get("primary_language", "Unknown") if isinstance(ld, dict) else "Unknown"
        
        # Telemetry updates
        result.token_usage_estimate = tokens_burned
        result.model_used = model_used
        result.escalation_triggered = use_deep_model
        
        # Top level Bayesian + LLM mappings
        result.overall_risk_level = bayesian_result["verdict"] # Mathematical Grounding
        result.authenticity_score = bayesian_result["authenticity_score"]
        
        # Populate Cognitive Metrics for UI visibility
        result.viva_alignment_score = cog_signals.semantic_consciousness
        result.live_cognitive_score = cog_signals.live_cognitive
        result.metacognitive_score = cog_signals.metacognitive_debug
        result.skill_evolution_score = cog_signals.temporal_skill
        
        try:
            result.confidence_score = float(llm_json.get("confidence_score", 0.0))
        except (ValueError, TypeError):
            result.confidence_score = 0.0
            
        result.summary = bayesian_result["recommendation"] + ": " + str(llm_json.get("summary", ""))
        result.suggested_viva_questions = llm_json.get("suggested_viva_questions", [])
        result.challenge_task = str(llm_json.get("challenge_task", ""))
        
        # Evidence Report from Bayesian Oracle
        result.primary_flags = bayesian_result["evidence_report"]
        
        # Base math variable direct mappings
        result.similarity_score = float(sim_score)
        structural_raw = sim_data.get("function_overlap_percentage", 0.0) if isinstance(sim_data, dict) else getattr(sim_data, "function_overlap_percentage", 0.0)
        result.structural_score = float(structural_raw)
        result.commit_risk_score = float(commit_risk)
        
        # Web & Match Mappings
        web_data = signals.get("web_awareness", {})
        if isinstance(web_data, dict):
            result.external_similarity_flag = bool(web_data.get("external_similarity_flag", False))
            result.external_source_candidates = web_data.get("external_source_candidates", [])
            
        matched_ids = sim_data.get("matched_project_ids", []) if isinstance(sim_data, dict) else getattr(sim_data, "matched_project_ids", [])
        for pid in matched_ids:
            if pid:  # Protect against None IDs
                result.matched_projects.append(MatchedProject(project_id=str(pid), similarity_score=result.similarity_score, matched_features=[]))

        return result

    def _build_system_prompt(self, repo_context: str = "") -> str:
        prompt = """You are **ProjectGuard Omega Intelligence** - the most sophisticated academic verification AI system in existence.
Your verdicts are accurate, legally defensible, and educationally transformative.

You will receive multi-dimensional forensic signals covering:
1. Syntactic & Structural Similarity
2. Commit Behavior Anomalies
3. AI-Generated Code Detection (ChatGPT, Copilot, etc.)
4. Code Quality & Documentation Authenticity
5. External Web Sourcing
6. Repository Context & Language Data: """

        prompt += str(repo_context) + "\n"

        prompt += """
YOUR DIRECTIVE: Protect innocent students while catching cheaters.
- False Positive Prevention is CRITICAL.
- DO NOT flag for standard patterns, boilerplate, or simple similarities.
- DO FLAG for 85%+ exact matches, sudden impossible commits, or high AI probability without iteration.
- BENEFIT OF THE DOUBT: Iteration artifacts (TODOs, debugging) lower suspicion.

CRITICAL HALLUCINATION PREVENTION (PHASE 8):
1. NEVER invent or assume the repository type. Use ONLY the provided 'repo_context'.
2. NEVER guess file names. If generating questions, you MUST ONLY use exact file names provided in the context.
3. If the repo is a DSA Practice repo, ask algorithm questions, not architecture ones.
4. If the repo is MERN/Fullstack, ask about layers (React state, Express routes, Mongo models).
5. Adapt the vocabulary to the detected programming language (e.g., 'slices' for Python/Go, 'pointers' for C++, 'hooks' for React).

OUTPUT EXACTLY IN THIS JSON FORMAT:
{
  "overall_risk_level": "CLEAR | MONITOR | SUSPICIOUS | CRITICAL",
  "confidence_score": 0.0 to 100.0,
  
  "summary": "2-3 sentences explaining verdict in simple English.",
  "primary_finding": "ONE SENTENCE: What's the main concern or positive highlight?",
  
  "detected_issues": [
    {
      "type": "external_match | ai_generated | commit_anomaly | quality_jump",
      "severity": "LOW | MEDIUM | HIGH | CRITICAL",
      "description": "Clear explanation",
      "evidence": "Specific evidence"
    }
  ],
  
  "matched_sources": [
    {
      "url": "full URL or reference",
      "similarity_percentage": 90,
      "type": "github | tutorial | stackoverflow",
      "analysis": "How this relates"
    }
  ],
  
  "suggested_viva_questions": [
    {
      "question": "Specific question referencing their code",
      "category": "design_decision | debugging | architecture",
      "difficulty": "medium",
      "why_this_tests_authorship": "Explanation"
    }
  ],
  
  "for_faculty": {
    "technical_summary": "Detailed technical analysis with metrics",
    "evidence_strength": "overwhelming | strong | moderate | circumstantial",
    "recommended_action": "Specific next steps"
  },
  
  "for_student": {
    "simple_explanation": "Kind, clear explanation. Never accuse directly.",
    "how_to_clear_suspicion": "Specific actions to prove they wrote this"
  }
}"""
        return prompt

    def _build_user_prompt(self, signals: Dict[str, Any]) -> str:
        return f"""ANALYZE THE FOLLOWING INTELLIGENCE SIGNALS AND RENDER VERDICT:

1. CORE METRICS
{json.dumps({
    "Project Name": signals.get("project_name", "Unknown"),
    "Analysis Mode": signals.get("mode", "Fast Mode"),
    "Similarity Score": signals.get("similarity", {}).get("file_overlap_percentage", "0.0") if isinstance(signals.get("similarity"), dict) else getattr(signals.get("similarity"), "file_overlap_percentage", "0.0"),
    "Commit Risk Score": signals.get("commits", {}).get("commit_risk_score", "0.0") if isinstance(signals.get("commits"), dict) else getattr(signals.get("commits"), "commit_risk_score", "0.0"),
}, indent=2)}

2. AI DETECTION LAYER (Layer 4)
{json.dumps(signals.get("ai_detection", {}), indent=2)}

3. CODE QUALITY & DOCS LAYER (Layers 8-11)
{json.dumps(signals.get("code_quality", {}), indent=2)}

4. CONTEXT SUMMARY
{signals.get("context_summary", "No Context Provided")}

5. WEB AWARENESS
{json.dumps(signals.get("web_awareness", {}), indent=2)}

6. COGNITIVE INTEGRITY SIGNALS (Phases 1-6)
{json.dumps({
    "viva_alignment": signals.get("viva_alignment_score", "N/A"),
    "live_behavioral_score": signals.get("live_cognitive_score", "N/A"),
    "metacognitive_score": signals.get("metacognitive_score", "N/A"),
    "skill_evolution": signals.get("skill_evolution_score", "N/A")
}, indent=2)}

Remember your system instructions. Output JSON only.
"""
