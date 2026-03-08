from typing import Dict, Any, List
from engine.agents.base_agent import BaseAgent
import time
import logging

logger = logging.getLogger(__name__)


class AnalysisOrchestrator:
    """
    ProjectGuard Omega — Central Intelligence Brain.

    Executes a multi-layer analysis pipeline:
      Layer 1-3: Preprocessing → Similarity → Commits (existing)
      Layer 4:   AI-Generated Code Detection (NEW)
      Layer 5:   Commit Behavior Analysis (existing)
      Layer 6:   External Source Detection (existing web agent)
      Layer 8-11: Code Quality & Documentation (NEW)
      Layer 12:  LLM Verdict Synthesis (enhanced)
      Live:      Challenge Generation (for high-risk)
    """

    def __init__(self, mode: str = "Deep Mode"):
        self.mode = mode
        self.agents: List[BaseAgent] = []

        # Core Agent Registry
        self.preprocessing_agent = None
        self.similarity_agent = None
        self.embedding_agent = None
        self.commit_agent = None
        self.web_agent = None
        self.verdict_agent = None

        # NEW Intelligence Agents
        self.ai_detection_agent = None
        self.code_quality_agent = None

    def register_agent(self, agent: BaseAgent):
        """Register independent agents into the Orchestrator"""
        name = agent.name
        if name == "Preprocessing": self.preprocessing_agent = agent
        elif name == "Similarity": self.similarity_agent = agent
        elif name == "Embedding": self.embedding_agent = agent
        elif name == "Commit": self.commit_agent = agent
        elif name == "WebAwareness": self.web_agent = agent
        elif name == "Verdict": self.verdict_agent = agent
        elif name == "AIDetection": self.ai_detection_agent = agent
        elif name == "CodeQuality": self.code_quality_agent = agent
        else: self.agents.append(agent)

    def analyze_submission(self, student_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        The Master Pipeline — 12-Layer Intelligence Execution.
        """
        start_time = time.time()

        # ═══════════════════════════════════════════════════════════
        # STEP 1: PREPROCESSING — Clone, parse, create ProjectMap
        # ═══════════════════════════════════════════════════════════
        if not self.preprocessing_agent:
            raise Exception("Preprocessing Agent is required.")

        print(f"[Orchestrator] ▶ Running {self.preprocessing_agent.name}...")
        project_data = self.preprocessing_agent.analyze(student_payload)

        # Extract context summary (0 LLM tokens)
        from engine.utils.context_extractor import ContextExtractor
        context_summary = ContextExtractor.generate_summary(project_data)

        # ═══════════════════════════════════════════════════════════
        # STEP 2: PARALLEL SIGNAL COLLECTION
        # ═══════════════════════════════════════════════════════════
        signals = {
            "mode": self.mode,
            "project_name": student_payload.get("project_name"),
            "context_summary": context_summary,
            "similarity": {},
            "embeddings": {},
            "commits": {},
            "web_awareness": {},
            "ai_detection": {},
            "code_quality": {},
            "repo_context": getattr(project_data, "repo_context", {}),
            "language_distribution": getattr(project_data, "language_distribution", {}),
        }

        similarity_threshold_breached = False
        commit_threshold_breached = False

        # Layer 1-3: Similarity Analysis
        if self.similarity_agent:
            print(f"[Orchestrator] ▶ Running {self.similarity_agent.name}...")
            sim_signal = self.similarity_agent.analyze(project_data)
            signals["similarity"] = sim_signal

            file_overlap = sim_signal.file_overlap_percentage if hasattr(sim_signal, "file_overlap_percentage") else sim_signal.get("file_overlap_percentage", 0)
            if float(file_overlap) > 0.40:
                similarity_threshold_breached = True

        # Embeddings (Deep Mode only)
        if self.embedding_agent and self.mode in ["Deep Mode", "Experimental Mode"]:
            print(f"[Orchestrator] ▶ Running {self.embedding_agent.name}...")
            signals["embeddings"] = self.embedding_agent.analyze(project_data)

        # Layer 5: Commit Behavior Analysis
        if self.commit_agent and student_payload.get("github_url"):
            print(f"[Orchestrator] ▶ Running {self.commit_agent.name}...")
            comm_signal = self.commit_agent.analyze(student_payload)
            signals["commits"] = comm_signal

            risk = comm_signal.commit_risk_score if hasattr(comm_signal, "commit_risk_score") else comm_signal.get("commit_risk_score", 0)
            if float(risk) > 0.40:
                commit_threshold_breached = True

        # ═══════════════════════════════════════════════════════════
        # STEP 3: NEW INTELLIGENCE LAYERS (run on ProjectMap)
        # ═══════════════════════════════════════════════════════════

        # Layer 4: AI-Generated Code Detection
        if self.ai_detection_agent:
            print(f"[Orchestrator] ▶ Running {self.ai_detection_agent.name}...")
            try:
                ai_signal = self.ai_detection_agent.analyze(project_data)
                signals["ai_detection"] = ai_signal
            except Exception as e:
                logger.warning(f"[Orchestrator] AI Detection failed (non-fatal): {e}")

        # Layers 8-11: Code Quality & Documentation
        if self.code_quality_agent:
            print(f"[Orchestrator] ▶ Running {self.code_quality_agent.name}...")
            try:
                cq_signal = self.code_quality_agent.analyze(project_data)
                signals["code_quality"] = cq_signal
            except Exception as e:
                logger.warning(f"[Orchestrator] Code Quality failed (non-fatal): {e}")

        # Layer 6: External Source Detection (cost-gated)
        if self.web_agent and self.mode == "Deep Mode" and (similarity_threshold_breached or commit_threshold_breached):
            print(f"[Orchestrator] ▶ Deep Mode: Running {self.web_agent.name}...")
            signals["web_awareness"] = self.web_agent.analyze(student_payload)

        # ═══════════════════════════════════════════════════════════
        # INTERROGATION ENGINE / QUESTION GENERATOR (Phase 3 & 4)
        # ═══════════════════════════════════════════════════════════
        try:
            from engine.analysis.interrogationEngine import InterrogationEngine
            interrogator = InterrogationEngine()
            project_map_dict = {
                "repo_analysis": signals["repo_context"],
                "language_distribution": signals["language_distribution"],
                "files": [{"path": f.path, "content": f.content[:5000]} for f in project_data.files]
            }
            viva_generation = interrogator.generate_from_repository(project_map_dict)
            if viva_generation.get("suggested_viva_questions"):
                signals["adversarial_questions"] = viva_generation["suggested_viva_questions"]
        except Exception as e:
            logger.warning(f"[Orchestrator] Interrogation Engine failed: {e}")

        # ═══════════════════════════════════════════════════════════
        # STEP 4: BAYESIAN VERDICT SYNTHESIS (PHASE 8)
        # ═══════════════════════════════════════════════════════════
        if not self.verdict_agent:
            raise Exception("Verdict Agent (LLM) is required.")

        # Inject cognitive metrics for the Bayesian VerdictAgent
        signals["viva_alignment_score"] = float(student_payload.get("viva_score", 0.7))
        signal_commits = signals.get("commits")
        signals["skill_evolution_score"] = getattr(signal_commits, "skill_evolution_score", 0.5) if hasattr(signal_commits, "skill_evolution_score") else 0.5
        signals["live_cognitive_score"] = float(student_payload.get("telemetry_score", 0.8))
        signals["adversarial_consensus"] = 0.75 
        signals["metacognitive_score"] = 0.6    
        
        print(f"[Orchestrator] ▶ Synthesizing Global Verdict via Bayesian Oracle...")
        final_result = self.verdict_agent.analyze(signals)

        # Merge adversarial questions if generated
        if "adversarial_questions" in signals:
             final_result.suggested_viva_questions = signals["adversarial_questions"]

        # Attach raw agent signals to result
        if signals.get("ai_detection"):
            final_result.ai_detection = signals["ai_detection"]
        if signals.get("code_quality"):
            final_result.code_quality = signals["code_quality"]

        # Build evidence breakdown
        final_result.evidence_breakdown = self._build_evidence_breakdown(signals)
        final_result.detected_issues = self._build_detected_issues(signals, final_result)

        # ═══════════════════════════════════════════════════════════
        # STEP 5: LIVE CHALLENGE GENERATION (high-risk only)
        # ═══════════════════════════════════════════════════════════
        risk = final_result.overall_risk_level.upper()
        if risk in ["SUSPICIOUS", "HIGH", "CRITICAL"] and project_data and hasattr(project_data, 'files'):
            try:
                from engine.sandbox.challenge_generator import ChallengeGenerator
                challenge_gen = ChallengeGenerator(self.verdict_agent.llm)
                challenge = challenge_gen.generate_from_project_map(project_data, difficulty="medium")
                if challenge:
                    final_result.live_challenge = challenge
                    logger.info(f"[Orchestrator] ⚡ Live challenge generated from '{challenge.get('filename', 'unknown')}'")
            except Exception as e:
                logger.warning(f"[Orchestrator] Challenge generation failed (non-fatal): {e}")

        # Set recommendation based on risk
        final_result.recommendation = self._determine_recommendation(final_result)

        final_result.processing_time_ms = int((time.time() - start_time) * 1000)
        return final_result.to_dict()

    def _build_evidence_breakdown(self, signals: Dict) -> Dict[str, Any]:
        """Compile all layer scores into a single evidence breakdown."""
        sim = signals.get("similarity", {})
        commits = signals.get("commits", {})
        ai = signals.get("ai_detection", {})
        cq = signals.get("code_quality", {})

        # Extract values safely (handle both objects and dicts)
        def _get(obj, key, default=0):
            if hasattr(obj, key):
                return getattr(obj, key)
            if isinstance(obj, dict):
                return obj.get(key, default)
            return default

        return {
            "syntactic_similarity": _get(sim, "file_overlap_percentage", 0),
            "structural_match": _get(sim, "name_overlap_percentage", 0),
            "ai_generation_probability": _get(ai, "ai_generation_probability", 0),
            "commit_risk": _get(commits, "commit_risk_score", 0),
            "human_authenticity": _get(ai, "human_authenticity_score", 100),
            "documentation_authenticity": _get(cq, "documentation_authenticity", 50),
            "code_cleanliness": _get(cq, "cleanliness_score", 50),
            "skill_level": _get(cq, "estimated_skill_level", "unknown"),
            "complexity_score": _get(cq, "complexity_score", 0),
        }

    def _build_detected_issues(self, signals: Dict, result) -> List[Dict]:
        """Compile detected issues from all layers."""
        issues = []

        # AI detection issues
        ai = signals.get("ai_detection", {})
        ai_prob = ai.get("ai_generation_probability", 0) if isinstance(ai, dict) else 0
        if ai_prob >= 60:
            issues.append({
                "type": "ai_generated",
                "severity": "CRITICAL" if ai_prob >= 80 else "HIGH",
                "description": f"AI-generated code probability: {ai_prob}%",
                "evidence": ", ".join(ai.get("detected_patterns", [])[:4]) if isinstance(ai, dict) else ""
            })

        # Code quality issues
        cq = signals.get("code_quality", {})
        if isinstance(cq, dict):
            if cq.get("overengineered_tooling"):
                issues.append({
                    "type": "quality_jump",
                    "severity": "HIGH",
                    "description": "Enterprise-level tooling in student project",
                    "evidence": ", ".join(cq.get("dep_flags", [])[:3])
                })
            if cq.get("code_cleanliness") == "too_perfect":
                issues.append({
                    "type": "quality_jump",
                    "severity": "MEDIUM",
                    "description": "Code is unusually clean with no iteration artifacts",
                    "evidence": ", ".join(cq.get("smell_flags", [])[:2])
                })
            if cq.get("suspicious_test_quality"):
                issues.append({
                    "type": "quality_jump",
                    "severity": "HIGH",
                    "description": "Test sophistication exceeds student-level expectations",
                    "evidence": ", ".join(cq.get("test_flags", [])[:2])
                })

        # Commit issues
        comm = signals.get("commits", {})
        comm_risk = comm.get("commit_risk_score", 0) if isinstance(comm, dict) else (comm.commit_risk_score if hasattr(comm, "commit_risk_score") else 0)
        if float(comm_risk) > 0.6:
            issues.append({
                "type": "commit_anomaly",
                "severity": "HIGH" if float(comm_risk) > 0.8 else "MEDIUM",
                "description": f"Commit risk score: {float(comm_risk):.1%}",
                "evidence": "Suspicious development timeline or commit patterns"
            })

        return issues

    def _determine_recommendation(self, result) -> str:
        """Determine appropriate recommendation based on risk level."""
        risk = result.overall_risk_level.upper()
        has_challenge = result.live_challenge is not None

        if risk in ["CLEAR", "LOW"]:
            return "CLEAR_TO_PASS"
        elif risk == "MONITOR":
            return "REQUIRE_VIVA"
        elif risk == "SUSPICIOUS":
            return "REQUIRE_LIVE_CODING" if has_challenge else "REQUIRE_VIVA"
        elif risk in ["HIGH", "CRITICAL"]:
            return "REQUIRE_LIVE_CODING" if has_challenge else "RECOMMEND_REJECTION"
        return "REQUIRE_VIVA"
