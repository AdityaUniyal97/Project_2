import json
import os
from typing import Dict, List, Optional

class PlagiarismRegistry:
    """
    Upgraded Registry: Stores and evaluates granular DNA submissions.
    This acts as the persistent memory for ProjectGuard AI.
    """
    
    def __init__(self, db_path: str = "registry_db.json"):
        self.db_path = db_path
        self._registry = self._load_registry()

    def _load_registry(self) -> Dict:
        if os.path.exists(self.db_path):
            try:
                with open(self.db_path, "r") as f:
                    return json.load(f)
            except Exception as e:
                print(f"[!] Registry Load Error: {e}")
                return {}
        return {}

    def save_registry(self):
        try:
            with open(self.db_path, "w") as f:
                json.dump(self._registry, f, indent=4)
        except Exception as e:
            print(f"[!] Registry Save Error: {e}")

    def add_project(self, student_id: str, project_dna: Dict):
        """Adds project DNA to the registry for comparison against future submissions."""
        self._registry[student_id] = project_dna
        self.save_registry()

    def find_matches(self, current_student_id: str, current_dna: Dict) -> List[Dict]:
        """
        Evaluates the current DNA against all projects in the registry.
        Uses SimilarityScorer for detailed logic matching.
        """
        from engine.core.similarity import SimilarityScorer
        
        matches = []
        scorer = SimilarityScorer()
        
        for student_id, other_dna in self._registry.items():
            if student_id == current_student_id:
                continue

            report = scorer.compare(current_dna, other_dna)
            # Only report if there is significant overlap
            if report["total_score"] > 10: 
                matches.append({
                    "student_id": student_id,
                    "project_name": other_dna.get("project_name", "Unknown"),
                    "report": report
                })

        return sorted(matches, key=lambda x: x["report"]["total_score"], reverse=True)
