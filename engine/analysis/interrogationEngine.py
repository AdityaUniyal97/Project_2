"""
PHASE 3 — ADVERSARIAL INTERROGATION PROTOCOL
interrogationEngine.py

Deploys a multi-agent consensus system for authorship verification:
1. THE CHALLENGER: Trap questions with misleading alternatives.
2. THE DEEP DIVER: Hyper-specific microscopic implementation details.
3. THE PATTERN ANALYZER: Detecting shifts in coding logic and style.
"""

from typing import Dict, Any, List
import random
import re

class InterrogationEngine:
    def __init__(self):
        # Mission Agents
        self.agents = ["THE_CHALLENGER", "THE_DEEP_DIVER", "THE_PATTERN_ANALYZER"]
        
        # Adversarial Trap Base (The Challenger)
        self.traps = [
            "Why didn't you use a simpler linear scan instead of this specific {algo} pattern? Would it have better space complexity?",
            "If we replaced {file}'s core logic with a recursion-based approach, what would be the impact on memory? Why stay with this iteration?",
            "In your {file}, would using a Global Variable for the state be more efficient than your current passing mechanism?"
        ]

        # Inconsistency Analysis (The Pattern Analyzer)
        self.style_checks = [
            "Your variable naming in {file} (e.g., {var}) seems to differ from the patterns in standard libraries. What was your rationale?",
            "Explain why you chose this specific indentation and line-wrap style in {file}; it remains consistent across the project, why?",
            "Walk me through the error handling in {file}. It seems stricter/looser than other modules. Why the shift?"
        ]

    def generate_from_repository(self, project_map: Dict[str, Any], ai_risk: float = 0.0) -> Dict[str, Any]:
        """
        Deploy the 3-Agent Adversarial Interrogation (PHASE 4).
        """
        files = project_map.get("files", [])
        if not files:
            return {"suggested_viva_questions": [], "status": "NO_CONTEXT"}

        # Forensics: Pick interesting files
        files_sorted = sorted(files, key=lambda f: len(f.get("content", "")), reverse=True)
        # Target the core logic file
        target_file_data = files_sorted[0]
        target_file_path = target_file_data.get("path", "main_file")
        target_file_name = target_file_path.split("/")[-1]
        content = target_file_data.get("content", "")
        
        # Line extraction for hyper-specificity
        lines = content.splitlines()
        interesting_line_idx = random.randint(min(10, len(lines)-1), min(100, len(lines)-1)) if len(lines) > 20 else 5
        target_line_num = interesting_line_idx + 1
        target_line_content = lines[interesting_line_idx].strip() if interesting_line_idx < len(lines) else ""

        # Variable identification
        vars_found = re.findall(r'\b[a-z_][A-Za-z0-9_]{4,}\b', content)
        target_var = random.choice(vars_found) if vars_found else "the internal state"

        questions = []

        # --- 1. AGENT 1: THE CHALLENGER (PHASE 4 AGENT 1) ---
        # Generate a trap: why NOT X (X is wrong/worse)
        traps = [
            f"In {target_file_name}, why didn't you use a session-based cookie approach instead of this specific logic? Wouldn't that be more standard?",
            f"If we replaced the logic on line {target_line_num} with a simpler recursive call, would it improve performance? Why didn't you choose that?",
            f"Why use {target_var} in this scope? Wouldn't a global singleton pattern be more efficient for this specific use case?"
        ]
        questions.append({
            "agent": "THE_CHALLENGER",
            "question": random.choice(traps),
            "category": "adversarial_trap",
            "why_this_tests_authorship": "Tests if the student can recognize a 'worse' alternative and defend their actual implementation choice."
        })

        # --- 2. AGENT 2: THE MICROSCOPE (PHASE 4 AGENT 2) ---
        questions.append({
            "agent": "THE_MICROSCOPE",
            "question": f"On line {target_line_num} of {target_file_name}, you wrote: `{target_line_content}`. Why this exact micro-decision? What specific edge case were you preventing here?",
            "category": "micro_implementation_recall",
            "why_this_tests_authorship": "Tests recall of micro-decisions that only the original author would remember, and AI summaries usually omit."
        })

        # --- 3. AGENT 3: THE PATTERN DETECTIVE (PHASE 4 AGENT 3) ---
        questions.append({
            "agent": "THE_PATTERN_DETECTIVE",
            "question": f"The architectural style in {target_file_name} uses a specific pattern for {target_var}. If you were to implement a similar module live now, would you stick to this naming and logic pattern? Why is it consistent with the rest of your repo?",
            "category": "architectural_consistency",
            "why_this_tests_authorship": "Checks for structural and stylistic awareness. Mismatches here often indicate copy-pasting from different sources."
        })

        return {
            "suggested_viva_questions": questions,
            "agent_consensus": "ACTIVE",
            "viva_mode": "ADVERSARIAL_CRUCIBLE",
            "repo_type": project_map.get("repo_analysis", {}).get("repo_type", "Unknown"),
            "primary_language": project_map.get("language_distribution", {}).get("primary_language", "Unknown")
        }
