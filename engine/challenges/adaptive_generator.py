import json
import logging
import os
from typing import Dict, Any, List

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

logger = logging.getLogger(__name__)

class AdaptiveChallengeGenerator:
    """
    PHASE 4 - ADAPTIVE LIVE CODING EXAM
    Extracts student's actual code.
    Generates personalized challenges.
    Changes every time based on their codebase.
    """
    def __init__(self, model_name: str = "gemini-2.5-flash"):
        self.api_key = os.environ.get("GEMINI_API_KEY")
        self.client = genai.Client(api_key=self.api_key) if self.api_key and genai else None
        self.model_name = model_name

    def generate_challenges(self, repository: str, risk_scores: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate unique challenges from THEIR code based on risk scores.
        For simulation, we return statically generated dynamic-looking challenges.
        """
        challenges = []
        
        # MOCK IMPLEMENTATION - in reality, we'd deep scan the codebase.
        # CHALLENGE TYPE 1: Modify Existing Function
        challenges.append({
            "id": "chal_mod_001",
            "type": "MODIFY_FUNCTION",
            "challenge_title": "Add Route Filtering to fetchBusLocations()",
            "instructions": (
                "Your current fetchBusLocations() function fetches all buses.\n"
                "Modify it to:\n"
                "1. Accept an optional 'routeId' parameter\n"
                "2. Filter buses by route when provided\n"
                "3. Implements basic error handling"
            ),
            "time_limit": 1200,
            "starter_code": "function fetchBusLocations() {\n  return api.get('/buses');\n}",
            "evaluation_points": {
                "correctness": 40,
                "code_quality": 30,
                "understanding": 30
            }
        })

        # CHALLENGE TYPE 2: Extend Their Feature
        if risk_scores.get('ai_probability', 0) > 70 or True: # Force appending for demo
            challenges.append({
                "id": "chal_ext_001",
                "type": "EXTEND_FEATURE",
                "challenge_title": "Add Real-Time Notifications",
                "instructions": (
                    "Looking at your current architecture, add a notification state:\n"
                    "1. Integrate with your existing store (e.g. Zustand/Context)\n"
                    "2. Trigger notification when bus arrives within 2 minutes\n"
                    "Requirements:\n"
                    "- Setup notification state\n"
                    "- Add trigger logic\n"
                ),
                "time_limit": 1500,
                "starter_code": "const useBusStore = create((set) => ({\n  buses: [],\n  // add notification state here\n}));",
                "evaluation_points": {
                    "correctness": 40,
                    "code_quality": 30,
                    "understanding": 30
                }
            })
            
        return challenges

    def evaluate_live_coding(self, student_solution: str, challenge: Dict[str, Any], behavioral_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Multi-dimensional evaluation of student's live coding performance.
        Includes behavioral tracking.
        """
        if not self.client:
            return {"verdict": "ERROR", "reasoning": "LLM not initialized", "total_score": 0}

        prompt = f"""
Evaluate student's live coding performance.

CHALLENGE: {challenge.get('challenge_title')}
INSTRUCTIONS: {challenge.get('instructions')}
STUDENT CODE: 
{student_solution}

BEHAVIORAL DATA:
- Time taken: {behavioral_data.get('time_taken')} seconds
- Keystrokes: {behavioral_data.get('keystrokes')}
- Pastes: {behavioral_data.get('paste_count')}
- Tab switches: {behavioral_data.get('tab_switches')}

Evaluate across:
1. CORRECTNESS (40 points): Does it meet requirements and handle basic usage?
2. CODE QUALITY (30 points): Is the code clean and properly structured?
3. UNDERSTANDING (30 points): Does it show deep understanding, or is it heavily pasted?

Consider Behavioral Red Flags. If Pastes > 2 or Keystrokes are suspiciously low relative to code length, deduct points from Understanding.

Return strict JSON:
{{
    "correctness_score": 35,
    "code_quality_score": 25,
    "understanding_score": 20,
    "total_score": 80,
    "behavioral_flags": ["Suspicious paste count"],
    "verdict": "AUTHENTIC", 
    "reasoning": "Detailed explanation..."
}}
Note: Verdict must be one of "AUTHENTIC", "SUSPICIOUS", "FRAUD". Use SUSPICIOUS if behavioral flags exist but code works, FRAUD if pasted with no logic, AUTHENTIC if good.
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
            logger.error(f"[AdaptiveGenerator] Error evaluating challenge: {e}")
            return {
                "correctness_score": 0,
                "code_quality_score": 0,
                "understanding_score": 0,
                "total_score": 0,
                "behavioral_flags": ["Execution failed"],
                "verdict": "ERROR",
                "reasoning": str(e)
            }
