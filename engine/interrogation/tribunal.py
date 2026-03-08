import os
import json
import logging
from typing import Dict, Any, List

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

logger = logging.getLogger(__name__)

class TribunalAgent:
    def __init__(self, name: str, role_description: str, model_name: str = "gemini-2.5-flash"):
        self.name = name
        self.role_description = role_description
        self.api_key = os.environ.get("GEMINI_API_KEY")
        self.client = genai.Client(api_key=self.api_key) if self.api_key and genai else None
        self.model_name = model_name

    def evaluate(self, question: str, answer: str, context: str) -> Dict[str, Any]:
        if not self.client:
            # Fallback
            return {"verdict": "MANUAL_REVIEW", "confidence": 0.5, "reasoning": "LLM not initialized"}
            
        prompt = f"""You are {self.name}.
{self.role_description}

You are evaluating a student's answer to an interrogation question.
Context:
{context}

Question Asked: {question}
Student's Answer: {answer}

Given your personality and focus, evaluate if the student's answer proves authentic authorship.
Output strictly in JSON format:
{{
    "decision": "AUTHENTIC" | "SUSPICIOUS" | "FRAUD",
    "confidence": 0.0 to 1.0,
    "reasoning": "A concise explanation of your verdict"
}}
"""
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.3,
                ),
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"[{self.name}] Interrogation error: {e}")
            return {"decision": "MANUAL_REVIEW", "confidence": 0.5, "reasoning": str(e)}


class AdversarialTribunal:
    def __init__(self):
        # We simulate the 5 distinct agents using our available LLM but with distinct personas
        self.agents = {
            "ARCHITECT": TribunalAgent(
                name="AGENT 1: THE ARCHITECT (Strategic, Big-Picture)",
                role_description="Focus on architecture decisions, scalability choices, framework selection. You expect deep reasoning for system design."
            ),
            "SURGEON": TribunalAgent(
                name="AGENT 2: THE SURGEON (Precise, Detail-Oriented)",
                role_description="Focus on specific lines, functions, algorithms. You are unforgiving about syntax, patterns, and precise logic."
            ),
            "HISTORIAN": TribunalAgent(
                name="AGENT 3: THE HISTORIAN (Timeline-focused)",
                role_description="Focus on evolution, version progression, and the learning trajectory over time."
            ),
            "DETECTIVE": TribunalAgent(
                name="AGENT 4: THE DETECTIVE (Skeptical)",
                role_description="Focus on pattern consistency, style mismatches. You look for copy-paste indicators and inconsistencies."
            ),
            "SABOTEUR": TribunalAgent(
                name="AGENT 5: THE SABOTEUR (Adversarial)",
                role_description="Focus on testing real understanding by presenting bugs or complex challenges."
            )
        }

    def generate_targeted_questions(self, consciousness_timeline: Dict[str, Any], anomalies: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Generates contextual questions based on the consciousness timeline.
        """
        questions = []
        if not anomalies:
            anomalies = []

        # ARCHITECT
        questions.append({
            "id": "q_arch",
            "agent_id": "ARCHITECT",
            "agent_name": "THE ARCHITECT",
            "question": "Looking at your system design, walk me through your microservices architecture decision. Why did you choose the state management strategy present in the project?",
            "challenge_type": "text"
        })
        
        # SURGEON
        questions.append({
            "id": "q_surg",
            "agent_id": "SURGEON",
            "agent_name": "THE SURGEON",
            "question": "Can you explain the exact time complexity of the primary data processing loops in your code? Why use map over forEach in certain components?",
            "challenge_type": "text"
        })
        
        # HISTORIAN: Utilize timeline anomalies if present
        historian_question = "Your timeline shows learning progression. What did you learn between the first and final implementation?"
        for anomaly in anomalies:
            if "flag" in anomaly and anomaly["flag"] == "IMPOSSIBLE_JUMP":
                historian_question = f"Between {anomaly.get('date', 'recent commits')}, your skill level jumped unexpectedly. Walk me through the exact learning resources and iterations you used during that gap."
                break
                
        questions.append({
            "id": "q_hist",
            "agent_id": "HISTORIAN",
            "agent_name": "THE HISTORIAN",
            "question": historian_question,
            "challenge_type": "text"
        })
        
        # DETECTIVE
        questions.append({
            "id": "q_det",
            "agent_id": "DETECTIVE",
            "agent_name": "THE DETECTIVE",
            "question": "Your repository shows some varying stylistic patterns across different files. Explain why certain modules have detailed comments while others have none, and if any code was adapted from external tutorials.",
            "challenge_type": "text"
        })
        
        # SABOTEUR: Code challenge
        questions.append({
            "id": "q_sab",
            "agent_id": "SABOTEUR",
            "agent_name": "THE SABOTEUR",
            "question": "I've injected a synthetic memory leak inside your main useEffect / lifecycle hook. Identify what is missing and provide the code to fix it.",
            "challenge_type": "code",
            "buggy_code": "useEffect(() => {\\n    const interval = setInterval(() => {\\n        fetchData()\\n    }, 1000)\\n    // Missing cleanup!\\n}, [])",
            "expected_fix": "useEffect(() => {\\n    const interval = setInterval(() => {\\n        fetchData()\\n    }, 1000)\\n    return () => clearInterval(interval)\\n}, [])"
        })

        return questions

    def compute_consensus(self, verdicts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        5 agents vote: AUTHENTIC / SUSPICIOUS / FRAUD
        """
        votes = {
            'AUTHENTIC': 0,
            'SUSPICIOUS': 0,
            'FRAUD': 0
        }
        
        for v in verdicts:
            decision = v.get("decision", "SUSPICIOUS")
            if decision in votes:
                votes[decision] += 1
            else:
                votes['SUSPICIOUS'] += 1
                
        if votes['AUTHENTIC'] == 5:
            return {
                'verdict': 'VERIFIED',
                'confidence': 0.95,
                'reasoning': 'All 5 agents confirmed authentic authorship'
            }
        
        if votes['FRAUD'] >= 2:
            return {
                'verdict': 'FRAUD',
                'confidence': 0.90,
                'reasoning': f'Multiple agents ({votes["FRAUD"]}) detected fraud indicators'
            }
        
        if votes['SUSPICIOUS'] >= 3 or (votes['FRAUD'] > 0 and votes['SUSPICIOUS'] > 0):
            return {
                'verdict': 'SUSPICIOUS',
                'confidence': 0.75,
                'reasoning': 'Majority of agents flagged inconsistencies or detected partial fraud.'
            }
        
        return {
            'verdict': 'MANUAL_REVIEW',
            'confidence': 0.60,
            'reasoning': f'Agents did not reach consensus (Auth:{votes["AUTHENTIC"]} Susp:{votes["SUSPICIOUS"]} Fraud:{votes["FRAUD"]})'
        }
