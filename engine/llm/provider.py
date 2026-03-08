from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple

class LLMProvider(ABC):
    """
    Abstract Interface for LLM Providers.
    Designed for maximum modularity and clean execution.
    NO fallback logic, model routing, or verdict mapping should exist here.
    """
    
    @abstractmethod
    def generate_json_response(self, system_prompt: str, user_payload: str, use_advanced_model: bool = False) -> Tuple[Dict[str, Any], int, str]:
        """
        Produce a structured JSON response from the underlying model.
        Returns: (JSON Dict, Token Count, Model Name Used)
        """
        pass

    @abstractmethod
    def get_token_estimate(self, text: str) -> int:
        """
        Estimates required tokens before inference to monitor costs.
        """
        pass
