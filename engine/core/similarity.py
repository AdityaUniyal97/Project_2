from typing import Dict, List, Set

class SimilarityScorer:
    """
    The Brain of Layer 1: Computes similarity across files, functions, and signatures.
    Essential for catch partial plagiarism on a budget.
    """

    def compare(self, dna1: Dict, dna2: Dict) -> Dict:
        # 1. Project Signature Match (The "Gotta Catch 'em All" check)
        sig_match = dna1.get("project_signature") == dna2.get("project_signature")
        if sig_match and dna1.get("project_signature") != "":
            return {
                "total_score": 100.0,
                "file_overlap_perc": 100.0,
                "func_overlap_perc": 100.0,
                "verdict": "CRITICAL: Exact Project Duplicate",
                "details": "All logical hashes match exactly."
            }

        # 2. File-Level Overlap (Jaccard Similarity on hashes)
        # Using hash_report because it handles multi-path collisions
        hashes1 = set(dna1.get("hash_report", {}).keys())
        hashes2 = set(dna2.get("hash_report", {}).keys())
        
        common_files = hashes1.intersection(hashes2)
        # Calculate file score as % of 'this' project found elsewhere
        file_score = (len(common_files) / max(len(hashes1), 1)) * 100

        # 3. Function-Level Overlap
        funcs1 = self._get_function_hashes(dna1)
        funcs2 = self._get_function_hashes(dna2)
        
        common_funcs = funcs1.intersection(funcs2)
        func_score = (len(common_funcs) / max(len(funcs1), 1)) * 100

        # Weighted Final Score (Architect Choice: Files = 70%, Functions = 30%)
        total_score = (file_score * 0.7) + (func_score * 0.3)

        verdict = "LOW"
        if total_score > 80: verdict = "CRITICAL: Near Duplicate"
        elif total_score > 50: verdict = "HIGH: Heavy Logic Reuse"
        elif total_score > 20: verdict = "MEDIUM: Suspicious Overlap"

        return {
            "total_score": round(total_score, 2),
            "file_overlap_perc": round(file_score, 2),
            "func_overlap_perc": round(func_score, 2),
            "verdict": verdict,
            "matched_files_count": len(common_files),
            "matched_functions_count": len(common_funcs)
        }

    def _get_function_hashes(self, dna: Dict) -> Set[str]:
        hashes = set()
        for f in dna.get("files", []):
            for func in f.get("functions", []):
                hashes.add(func["hash"])
        return hashes
