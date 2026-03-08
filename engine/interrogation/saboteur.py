import json
import logging
import os
from typing import Dict, Any

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

logger = logging.getLogger(__name__)

class SaboteurEngine:
    """
    PHASE 3 - THE SABOTEUR
    Injects realistic bugs into student code, monitors debugging process, and evaluates fix quality.
    """
    def __init__(self, model_name: str = "gemini-2.5-flash"):
        self.api_key = os.environ.get("GEMINI_API_KEY")
        self.client = genai.Client(api_key=self.api_key) if self.api_key and genai else None
        self.model_name = model_name

    def generate_challenge(self, repository_context: str, anomaly: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parses student's code (or uses anomaly context)
        Injects realistic bug and returns challenge.
        For this simulation, we'll return a React Memory Leak bug profile.
        """
        original_code = """useEffect(() => {
    const interval = setInterval(() => {
        fetchBusLocations()
    }, 1000)
}, [])"""
        
        buggy_code = """useEffect(() => {
    const interval = setInterval(() => {
        fetchBusLocations()
    }, 1000)
    // Missing cleanup!
}, [])"""
        
        expected_fix = """useEffect(() => {
    const interval = setInterval(() => {
        fetchBusLocations()
    }, 1000)
    
    return () => clearInterval(interval)  // Correct fix
}, [])"""
        
        return {
            "challenge_id": "sab_leak_001",
            "challenge_type": "CODE_DEBUGGING",
            "file": "src/hooks/useBusData.ts", # dynamic context mock
            "original_code": original_code,
            "buggy_code": buggy_code,
            "bug_type": "MEMORY_LEAK",
            "time_limit": 900,  # 15 minutes
            "expected_fix": expected_fix,
            "evaluation_criteria": {
                "identifies_bug_type": 25,
                "locates_exact_line": 25,
                "explains_why_bug": 25,
                "provides_correct_fix": 25
            }
        }

    def evaluate_debugging_response(self, student_fix: str, expected_fix: str, bug_type: str, explanation: str) -> Dict[str, Any]:
        """
        AI evaluates student's debugging performance.
        """
        if not self.client:
            return {"verdict": "ERROR", "reasoning": "LLM not initialized", "total_score": 0}

        prompt = f"""You are assessing a student's debugging challenge.

BUG TYPE: {bug_type}
EXPECTED FIX: {expected_fix}

STUDENT EXPLANATION:
{explanation}

STUDENT FIX CODE:
{student_fix}

Evaluate on 4 criteria (0-25 points each):
1. BUG IDENTIFICATION (25 pts): Did they correctly identify the issue? Do they understand what makes it a bug?
2. LOCATION ACCURACY (25 pts): Did they pinpoint the exact problematic line or logic?
3. EXPLANATION QUALITY (25 pts): Do they explain WHY it's a bug and the consequences?
4. FIX CORRECTNESS (25 pts): Is the fix technically correct out of the box?

Calculate total_score = sum of the 4 scores.
Then determine verdict:
- 80-100 pts: "AUTHENTIC"
- 50-79 pts: "SUSPICIOUS"
- 0-49 pts or complete misunderstanding: "FRAUD"

Return strict JSON:
{{
    "bug_identification_score": 25,
    "location_accuracy_score": 25,
    "explanation_quality_score": 25,
    "fix_correctness_score": 25,
    "total_score": 100,
    "verdict": "AUTHENTIC",
    "reasoning": "Detailed explanation of verdict...",
    "red_flags": ["list", "of", "issues"]
}}
"""
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                ),
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"[Saboteur] Error evaluating fix: {e}")
            return {
                "bug_identification_score": 0,
                "location_accuracy_score": 0,
                "explanation_quality_score": 0,
                "fix_correctness_score": 0,
                "total_score": 0,
                "verdict": "ERROR",
                "reasoning": str(e),
                "red_flags": ["Execution failed"]
            }
