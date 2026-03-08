"""
PHASE 5 — CROSS-REPOSITORY PLAGIARISM GRAPH
structuralSimilarityEngine.py

Calculates the structural DNA overlap between a new submission and
the entire historical registry of previous projects.
"""

from typing import Dict, Any, List
from engine.registry.registry_store import RegistryStore
from engine.models.signals import ProjectMap

class StructuralSimilarityEngine:
    def __init__(self, registry: RegistryStore):
        self.registry = registry

    def analyze_global_overlap(self, project_map: ProjectMap) -> Dict[str, Any]:
        """
        Calculates how much of this project exists elsewhere in the database.
        """
        matches = self.registry.find_matches(project_map)
        
        file_collisions = matches["file_collisions"]
        func_collisions = matches["func_collisions"]
        total_files = max(1, matches["total_new_files"])
        total_funcs = max(1, matches["total_new_funcs"])

        # Calculate overlap percentages per project
        project_scores = {}
        
        # Merge file and function collisions into a per-project weight
        all_matched_pids = set(file_collisions.keys()) | set(func_collisions.keys())
        
        max_overlap_score = 0.0
        primary_match_pid = None

        for pid in all_matched_pids:
            # File overlap weight (50%)
            f_count = len(file_collisions.get(pid, []))
            f_percent = f_count / total_files
            
            # Function overlap weight (50%)
            fn_count = len(func_collisions.get(pid, []))
            fn_percent = fn_count / total_funcs
            
            # Combined structural DNA match
            combined = (f_percent * 0.4) + (fn_percent * 0.6)
            project_scores[pid] = combined
            
            if combined > max_overlap_score:
                max_overlap_score = combined
                primary_match_pid = pid

        return {
            "cross_repo_similarity_score": round(max_overlap_score, 3),
            "primary_match_id": primary_match_pid,
            "total_collisions_detected": len(all_matched_pids),
            "is_exact_match": len(matches["exact_project_matches"]) > 0,
            "is_template_reuse": max_overlap_score > 0.4 and total_files > 5 and len(all_matched_pids) > 10
        }
