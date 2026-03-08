import os
import json
import random
from typing import Dict, Any, Tuple

# Use new sdk
try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

from engine.llm.provider import LLMProvider

class GeminiProvider(LLMProvider):
    """
    Concrete implementation of the LLMProvider for Google Gemini.
    """
    def __init__(self, default_flash_model: str = "gemini-2.5-flash", advanced_pro_model: str = "gemini-2.5-pro"):
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if not self.api_key:
            print("[Warning] GEMINI_API_KEY environment variable not set. Will fall back to safe error state.")
            
        self.client = None
        if self.api_key and genai is not None:
            self.client = genai.Client(api_key=self.api_key)
            print("[System] Gemini API Initialized.")
        
        # Dual-Model Architecture Setup
        self.fast_model = default_flash_model
        self.pro_model = advanced_pro_model

    def generate_json_response(self, system_prompt: str, user_payload: str, use_advanced_model: bool = False) -> Tuple[Dict[str, Any], int, str]:
        """
        Sends signals to Gemini with strict Token budgeting.
        """
        if not self.api_key or not self.client:
            return self.create_error_fallback("No LLM API Key Configured. (Ensure GEMINI_API_KEY is in your environment)"), 0, "None"
            
        # Target Model
        target_model = self.pro_model if use_advanced_model else self.fast_model

        # Build prompt
        full_prompt = f"{system_prompt}\n\nSignals Data:\n{user_payload}"
        
        # Step 1: Enforce Token Budget
        tokens_estimated = self.get_token_estimate(full_prompt)
        if tokens_estimated > 1200:
            print(f"[GeminiProvider] Context too large. Compressing context (Est tokens: {tokens_estimated})")
            # Try compression if too big
            user_payload = user_payload[:3000] # Safe trim
            full_prompt = f"{system_prompt}\n\nSignals Data:\n[COMPRESSED]\n{user_payload}"
            tokens_estimated = self.get_token_estimate(full_prompt)
            if tokens_estimated > 1200:
                error_msg = f"Token limit exceeded! Expected {tokens_estimated} tokens but max is strictly 1200 even after compression."
                print(f"[GeminiProvider] {error_msg}")
                return self.create_error_fallback(error_msg), tokens_estimated, target_model
            
        # Add random seed to avoid exact determinism
        seed = random.randint(1, 100000)
            
        try:
            # Step 3: Single-shot inference call
            response = self.client.models.generate_content(
                model=target_model,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    seed=seed,
                ),
            )
            result = json.loads(response.text)
            return result, tokens_estimated, target_model
        except json.JSONDecodeError:
            print("[GeminiProvider] Failed to parse JSON response from LLM.")
            return self.create_error_fallback("LLM produced malformed response"), tokens_estimated, target_model
        except Exception as e:
            print(f"[GeminiProvider] Upstream LLM Error: {str(e)}")
            return self.create_error_fallback(f"AI Service Interruption: {str(e)}"), tokens_estimated, target_model

    def get_token_estimate(self, text: str) -> int:
        """
        Estimates required tokens before inference to monitor costs.
        Lightweight approximation to satisfy abstract contract.
        """
        return int(len(text.split()) * 1.3)

    def create_error_fallback(self, error_msg: str) -> Dict[str, Any]:
        """Provides a safe structural response when LLM inference fails."""
        return {
            "overall_risk_level": "ERROR",
            "confidence_score": 0.0,
            "summary": f"LLM Inference Failure: {error_msg}",
            "suggested_viva_questions": [],
            "challenge_task": ""
        }
