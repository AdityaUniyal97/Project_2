import os
import subprocess
import tempfile
import shutil
import json
import logging
from typing import Dict, Any, List

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

logger = logging.getLogger(__name__)

class QuantumCommitArchaeologist:
    """
    PHASE 1: QUANTUM COMMIT ARCHAEOLOGY
    Feeds entire git history into Gemini 2.0 Flash (1M context) to reconstruct developer consciousness evolution.
    """
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        self.client = genai.Client(api_key=self.api_key) if self.api_key and genai else None
        # Use the flash model capable of massive context
        self.model_name = "gemini-2.5-flash"

    def analyze_repository(self, github_url: str) -> Dict[str, Any]:
        """
        Main entry point: Clone, Extract, Analyze, and Score.
        """
        temp_dir = tempfile.mkdtemp(prefix="pg_quantum_")
        try:
            if not self._clone_bare(github_url, temp_dir):
                return {"error": "Failed to clone repository"}
                
            raw_git_log = self._extract_full_history(temp_dir)
            if not raw_git_log or not str(raw_git_log).strip():
                return {"error": "No commit history found or git clone failed."}
                
            llm_analysis = self._run_gemini_analysis(raw_git_log)
            if "error" in llm_analysis:
                return llm_analysis
                
            # Step 4: Calculate Temporal Consciousness Score
            final_result = self._process_consciousness_score(llm_analysis)
            
            # Step 5: Generate Interactive Timeline Data for Frontend
            final_result["timeline_data"] = self._generate_timeline_data(final_result)
            
            return final_result
            
        except Exception as e:
            logger.error(f"[Quantum Archaeologist] Failed {e}")
            import traceback
            traceback.print_exc()
            return {"error": str(e)}
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    def _clone_bare(self, github_url: str, target: str) -> bool:
        result = subprocess.run(
            ["git", "clone", "--bare", github_url, target],
            capture_output=True, text=True, timeout=120
        )
        return result.returncode == 0

    def _extract_full_history(self, repo_dir: str) -> str:
        # Step 1: Git History Extraction
        # Get standard log layout + file additions/deletions + diff
        result = subprocess.run(
            [
                "git", "-C", repo_dir, "log", "--all", "--full-history",
                "--pretty=format:COMMIT_START|||%H|||%an|||%at|||%s",
                "--numstat", "-p"
            ],
            capture_output=True, timeout=120
        )
        return result.stdout.decode("utf-8", errors="replace") if result.returncode == 0 else ""

    def _run_gemini_analysis(self, raw_git_log: str) -> Dict[str, Any]:
        if not self.client:
            return {"error": "Gemini API client not initialized"}
            
        # Temporal chunking strategy:
        # If the log is extraordinarily huge, we would split by commits.
        # But for typical repos, Gemini 1M context can take it all in one shot.
        # We will truncate safely to 60,000 characters (~15K tokens) to avoid hitting free-tier Gemini API TPM limits bounds.
        max_chars = 60000 
        if len(raw_git_log) > max_chars:
            raw_git_log = raw_git_log[-max_chars:] # Take the most recent history primarily, or chunk it.
            
        prompt = """You are analyzing a developer's Git commit history to reconstruct their consciousness evolution.

I will provide the complete commit history with diffs. Your task:

ANALYZE EACH COMMIT and determine:

1. MENTAL STATE: What was the developer thinking at this moment?
   - Were they confident or uncertain?
   - Did they understand the problem clearly?
   - Were they exploring or implementing?

2. SKILL LEVEL: Rate their understanding (0-10)
   - 0-3: Beginner, copying without understanding
   - 4-6: Intermediate, understands basics
   - 7-9: Advanced, making informed decisions
   - 10: Expert, architectural mastery

3. DECISION RATIONALE: Why did they make this choice?
   - What problem were they solving?
   - What alternatives existed?
   - Why THIS approach?

4. COGNITIVE FLAGS: Detect anomalies
   - IMPOSSIBLE_JUMP: Skill level increases >3 points in one commit
   - MISSING_CONTEXT: Complex code appears without foundation
   - COPY_PASTE_SIGNATURE: Perfect code with zero evolution
   - AI_GENERATION_PATTERN: Typical LLM code structure

5. LEARNING TRAJECTORY: Track evolution
   - Plot skill progression over time
   - Identify breakthrough moments
   - Detect plateaus and struggles
   - Find copy-paste incidents

OUTPUT FORMAT: Strict JSON matching this structure:
{
  "commits": [
    {
      "hash": "abc123",
      "timestamp": "2024-01-15T10:30:00Z",
      "message": "Add authentication",
      "skill_level": 6,
      "mental_state": "Implementing learned pattern from tutorial",
      "decision_rationale": "Using JWT because saw it in documentation",
      "cognitive_flags": [],
      "understanding_depth": "Medium - knows WHAT but not WHY"
    }
  ],
  "timeline_analysis": {
    "total_commits": 47,
    "skill_progression": "LINEAR|EXPONENTIAL|SUDDEN_JUMP|PLATEAU",
    "authenticity_probability": 0.0,
    "red_flags_count": 3,
    "major_anomalies": ["issue1"],
    "learning_curve_verdict": "SUSPICIOUS - Missing intermediate learning stages"
  },
  "consciousness_reconstruction": "Narrative paragraph of the developer's thought evolution"
}

Analyze the following commit history:
"""
        
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt + "\n[GIT LOG]\n" + raw_git_log,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                ),
            )
            return json.loads(response.text)
        except Exception as e:
            return {"error": f"LLM Generation Failed: {e}"}

    def _process_consciousness_score(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate Temporal Consciousness Score based on LLM output."""
        timeline = analysis.get("timeline_analysis", {})
        
        # Determine smoothness
        progression = timeline.get("skill_progression", "LINEAR")
        smoothness = 1.0 if progression == "LINEAR" else (0.8 if progression == "EXPONENTIAL" else (0.5 if progression == "PLATEAU" else 0.2))
        
        # Determine rationale depth (average skill level as a proxy)
        commits = analysis.get("commits", [])
        avg_skill = sum(c.get("skill_level", 5) for c in commits) / max(1, len(commits))
        rationale_depth = avg_skill / 10.0
        
        # Red flags severity
        flags_count = timeline.get("red_flags_count", 0)
        red_flags_severity = min(1.0, flags_count * 0.2)
        
        # Naturalness (authenticity proxy from LLM)
        learning_naturalness = float(timeline.get("authenticity_probability", 0.5))
        
        # Formula given by spec
        score = (smoothness * 0.3) + (rationale_depth * 0.25) + ((1 - red_flags_severity) * 0.25) + (learning_naturalness * 0.2)
        
        analysis["temporal_consciousness_score"] = round(max(0.0, min(1.0, score)), 3)
        return analysis

    def _generate_timeline_data(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Convert LLM analysis into format required for the interactive timeline visualization."""
        timeline_events = []
        skill_curve = []
        complexity_curve = []
        anomaly_markers = []
        
        commits = analysis.get("commits", [])
        commits = sorted(commits, key=lambda c: c.get("timestamp", ""))
        
        for c in commits:
            ts = c.get("timestamp", "")
            skill = c.get("skill_level", 0)
            
            # Simple complexity proxy - in reality, computed from diff size
            complexity = min(10, skill + (1 if c.get("cognitive_flags") else 0)) 
            
            flag = c.get("cognitive_flags", [])
            primary_flag = flag[0] if flag else None
            
            event_type = "anomaly" if primary_flag else "learning"
            
            timeline_events.append({
                "date": ts[:10] if ts else "",
                "title": c.get("message", "Commit"),
                "description": c.get("mental_state", ""),
                "skill_level": skill,
                "complexity": complexity,
                "confidence": "High" if skill > 6 else "Low",
                "type": event_type,
                "flag": primary_flag,
                "hash": c.get("hash", "")
            })
            
            skill_curve.append([ts, skill])
            complexity_curve.append([ts, complexity])
            
            if primary_flag:
                severity = "CRITICAL" if "IMPOSSIBLE" in primary_flag or "COPY_PASTE" in primary_flag else "HIGH"
                anomaly_markers.append([ts, primary_flag, severity])
                
        return {
            "timeline_events": timeline_events,
            "animation_data": {
                "skill_curve": skill_curve,
                "complexity_curve": complexity_curve,
                "anomaly_markers": anomaly_markers
            }
        }
