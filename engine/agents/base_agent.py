from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseAgent(ABC):
    """
    Abstract interface for all independent AI Agents.
    Enforces that every agent must take a payload and return standard signals.
    """
    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def analyze(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Receives raw data or partial signals, processes them independently,
        and returns a specific set of signals for the Orchestrator.
        """
        pass
