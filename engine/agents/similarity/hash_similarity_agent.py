from typing import Dict, Any, List
from engine.agents.base_agent import BaseAgent
from engine.registry.registry_store import RegistryStore
from engine.models.signals import ProjectMap, SimilaritySignal

class HashSimilarityAgent(BaseAgent):
    """
    Agent 2: Hash Similarity
    Mathematical intelligence protecting the LLM. 
    Performs fast, exact duplicate detection and file-level collision logic.
    Zero AI cost. O(1) database lookups.
    """
    def __init__(self, registry: RegistryStore):
        super().__init__(name="Similarity")
        self.registry = registry
        
        # Architect tuning weights
        self.WEIGHT_FILE_OVERLAP = 0.7
        self.WEIGHT_FUNC_OVERLAP = 0.3

    def analyze(self, project_map: ProjectMap) -> SimilaritySignal:
        """
        Takes the Preprocessed ProjectMap. 
        Checks against SQLite Registry.
        Returns the standard SimilaritySignal.
        """
        signal = SimilaritySignal()
        
        # If the project failed in Agent 1, Agent 2 does nothing.
        if project_map.error or project_map.total_files == 0:
            return signal

        # 1. Query the Database
        matches_report = self.registry.find_matches(project_map)
        
        # 2. Check Layer 1: Instant Exact Project Match
        exact_matches = matches_report.get("exact_project_matches", [])
        if exact_matches:
            signal.exact_match = True
            signal.project_similarity_score = 1.0
            signal.file_overlap_percentage = 1.0
            signal.function_overlap_percentage = 1.0
            signal.matched_project_ids = exact_matches
            
            # Immediately persist to registry for future students
            self.registry.register_project(project_map)
            return signal

        # 3. Check Layer 2: File Collisions (Partial Plagiarism)
        file_collisions = matches_report.get("file_collisions", {})
        func_collisions = matches_report.get("func_collisions", {})
        
        total_new_files = max(matches_report.get("total_new_files", 1), 1)
        
        highest_file_overlap = 0.0
        primary_culprit_id = None
        
        # Analyze collision matrix to find the MOST similar previous project
        for matched_pid, collided_hashes in file_collisions.items():
            overlap_perc = len(collided_hashes) / total_new_files
            
            signal.similarity_matrix[matched_pid] = {
                "file_overlap_perc": overlap_perc,
                "collided_files_count": len(collided_hashes)
            }
            
            if matched_pid not in signal.matched_project_ids:
                signal.matched_project_ids.append(matched_pid)
            
            if overlap_perc > highest_file_overlap:
                highest_file_overlap = overlap_perc
                primary_culprit_id = matched_pid

        signal.file_overlap_percentage = highest_file_overlap
        
        # 4. Check Layer 3: Function Collisions (Structural Plagiarism)
        signal.function_overlap_percentage = self._calculate_function_overlap(
            matches_report, primary_culprit_id
        )

        # 5. Weighted Overall Score
        signal.project_similarity_score = (
            (signal.file_overlap_percentage * self.WEIGHT_FILE_OVERLAP) +
            (signal.function_overlap_percentage * self.WEIGHT_FUNC_OVERLAP)
        )

        # 6. We evaluated it, it's now part of the history database
        self.registry.register_project(project_map)

        return signal

    def _calculate_function_overlap(self, matches_report: Dict[str, Any], culprit_id: str) -> float:
        """
        Uses structural AST hashes to bypass variable renaming.
        """
        func_collisions = matches_report.get("func_collisions", {})
        total_new_funcs = max(matches_report.get("total_new_funcs", 1), 1)

        # If we have a primary culprit from file overlap, heavily weigh their function overlap
        if culprit_id and culprit_id in func_collisions:
            return len(func_collisions[culprit_id]) / total_new_funcs
        
        # Otherwise, find the worst offender structurally
        highest_func_overlap = 0.0
        for pid, collided_hashes in func_collisions.items():
            overlap = len(collided_hashes) / total_new_funcs
            if overlap > highest_func_overlap:
                highest_func_overlap = overlap
                
        return highest_func_overlap
