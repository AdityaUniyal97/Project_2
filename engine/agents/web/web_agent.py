import requests
import urllib.parse
from typing import Dict, Any, List
from engine.agents.base_agent import BaseAgent

class WebAgent(BaseAgent):
    """
    Agent 6: Web Awareness Layer (Controlled Deep Mode ONLY)
    Performs narrow, constrained queries against public GitHub repositories to detect completely external cloning
    without processing heavy raw code logic. Extremely API limit aware.
    """
    # Simple class-level cache to prevent bursting Github rate limit
    _cache: Dict[str, Dict[str, Any]] = {}

    def __init__(self, github_token: str = None):
        super().__init__(name="WebAwareness")
        self.github_token = github_token
        self.GITHUB_SEARCH_API = "https://api.github.com/search/repositories"

    def analyze(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Receives simple metadata, outputs a boolean flag and possible external source candidates.
        Only called by orchestrator if local similarity or commit risks trigger the necessity.
        """
        project_name = payload.get("project_name", "")
        # Remove common academic stops to narrow search
        query = project_name.lower().replace("submission", "").replace("assignment", "").strip()
        
        result = {
            "external_similarity_flag": False,
            "external_source_candidates": []
        }

        if not query or len(query) < 4:
            return result

        if query in self._cache:
            return self._cache[query]

        # Formulate query searching for exactly the project name in repo names
        params = {"q": f"{query} in:name", "per_page": 5}
        
        headers = {"Accept": "application/vnd.github.v3+json"}
        if self.github_token:
            headers["Authorization"] = f"token {self.github_token}"

        try:
            response = requests.get(self.GITHUB_SEARCH_API, headers=headers, params=params, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                items = data.get("items", [])
                
                # If there are exactly named repos matching what the student submitted
                for item in items:
                    name_match = query in item["name"].lower()
                    if name_match:
                        result["external_similarity_flag"] = True
                        result["external_source_candidates"].append(item["html_url"])
                        
                # Store in cache
                self._cache[query] = result
        except Exception as e:
            # We don't crash the orchestrator on transient web errors
            pass

        return result
