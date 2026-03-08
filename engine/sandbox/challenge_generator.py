"""
Challenge Generator - Extracts functions from student projects and generates
live coding challenges using Gemini AI.

Integrates with the existing LLMProvider architecture.
"""

import re
import json
import random
import logging
from typing import Dict, List, Any, Optional
from engine.llm.provider import LLMProvider
from engine.models.signals import ProjectMap, ParsedFile, ParsedFunction

logger = logging.getLogger(__name__)


class ChallengeGenerator:
    """
    Extracts real functions from a student's code and uses Gemini to
    generate a modification-based live coding challenge.
    """

    def __init__(self, llm_provider: LLMProvider):
        self.llm = llm_provider

    def generate_from_project_map(
        self,
        project_map: ProjectMap,
        difficulty: str = "medium"
    ) -> Optional[Dict[str, Any]]:
        """
        Generate a live coding challenge from the student's actual ProjectMap.

        Args:
            project_map: The parsed project from the PreprocessingAgent
            difficulty: "easy" | "medium" | "hard"

        Returns:
            Challenge dict or None if generation fails
        """
        # 1. Extract candidate functions from the project map
        candidates = self._extract_candidates(project_map)

        if not candidates:
            logger.warning("[ChallengeGen] No suitable functions found, using fallback")
            return self._generate_fallback_challenge(self._detect_language(project_map))

        # 2. Select best function based on difficulty
        selected = self._select_by_difficulty(candidates, difficulty)

        # 3. Use LLM to generate intelligent modification challenge
        challenge = self._generate_llm_challenge(selected)

        return challenge

    def _extract_candidates(self, project_map: ProjectMap) -> List[Dict]:
        """Extract all candidate functions from project files"""
        candidates = []

        for parsed_file in project_map.files:
            # Only use files that have parsed functions
            for func in parsed_file.functions:
                if func.size < 30:  # Skip trivially small functions
                    continue

                candidates.append({
                    "filename": parsed_file.path,
                    "function_name": func.name,
                    "code": func.body,
                    "size": func.size,
                    "language": self._detect_file_language(parsed_file.path)
                })

        return candidates

    def _detect_language(self, project_map: ProjectMap) -> str:
        """Detect primary language of the project"""
        ext_counts = {}
        for f in project_map.files:
            ext = f.path.rsplit('.', 1)[-1] if '.' in f.path else ''
            ext_counts[ext] = ext_counts.get(ext, 0) + 1

        if not ext_counts:
            return "python"

        dominant = max(ext_counts, key=ext_counts.get)
        return {
            'py': 'python',
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'javascript',
            'tsx': 'javascript',
        }.get(dominant, 'python')

    def _detect_file_language(self, filepath: str) -> str:
        """Detect language from file extension"""
        ext = filepath.rsplit('.', 1)[-1] if '.' in filepath else ''
        return {
            'py': 'python',
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'javascript',
            'tsx': 'javascript',
        }.get(ext, 'python')

    def _select_by_difficulty(self, candidates: List[Dict], difficulty: str) -> Dict:
        """Select a function based on complexity/difficulty"""
        # Score by complexity
        scored = []
        for func in candidates:
            score = self._compute_complexity(func['code'])
            scored.append((score, func))

        scored.sort(key=lambda x: x[0])

        if difficulty == "easy":
            return scored[0][1]
        elif difficulty == "hard":
            return scored[-1][1]
        else:  # medium
            mid_idx = len(scored) // 2
            return scored[mid_idx][1]

    def _compute_complexity(self, code: str) -> int:
        """Calculate a rough complexity score for a function"""
        score = 0
        score += code.count('if ') * 2
        score += code.count('for ') * 3
        score += code.count('while ') * 3
        score += code.count('return ') * 1
        score += code.count('try:') * 2
        score += code.count('class ') * 5
        score += len(code) // 20  # Length factor
        return score

    def _generate_llm_challenge(self, func_data: Dict) -> Optional[Dict[str, Any]]:
        """Use the existing LLM provider to generate a challenge"""
        system_prompt = (
            "You are the Challenge Generator for ProjectGuard AI. "
            "Given a function from a student's code project, create a SHORT live coding challenge. "
            "The challenge should test whether the student can MODIFY their own code - something "
            "only the real author would find easy.\n\n"
            "INSTRUCTIONS:\n"
            "1. Output ONLY valid JSON.\n"
            "2. The challenge must be completable in 10 minutes by the real author.\n"
            "3. Create 3 test cases with clear input/output pairs.\n"
            "4. The 'starter_code' should be a modified version of the function signature.\n"
            "5. Keep descriptions concise and direct.\n\n"
            "JSON Schema:\n"
            "{\n"
            '  "challenge_description": "string (1-2 sentences)",\n'
            '  "requirements": ["string", "string", "string"],\n'
            '  "test_cases": [\n'
            '    {"input": {"param1": value}, "expected_output": value, "description": "string"}\n'
            '  ],\n'
            '  "starter_code": "string (function skeleton)",\n'
            '  "hints": ["string"]\n'
            "}"
        )

        user_prompt = (
            f"Student's function from file '{func_data['filename']}':\n\n"
            f"```{func_data['language']}\n"
            f"{func_data['code']}\n"
            f"```\n\n"
            f"Generate a modification challenge for this function."
        )

        try:
            llm_json, tokens, model = self.llm.generate_json_response(
                system_prompt=system_prompt,
                user_payload=user_prompt,
                use_advanced_model=False  # Use flash model for cost efficiency
            )

            # Validate minimum required fields
            if "overall_risk_level" in llm_json and llm_json.get("overall_risk_level") == "ERROR":
                logger.warning("[ChallengeGen] LLM returned error state, using fallback")
                return self._generate_fallback_challenge(func_data['language'])

            return {
                "original_code": func_data['code'],
                "filename": func_data['filename'],
                "function_name": func_data['function_name'],
                "challenge_description": llm_json.get("challenge_description", "Modify this function"),
                "requirements": llm_json.get("requirements", ["Complete the function"]),
                "test_cases": llm_json.get("test_cases", []),
                "starter_code": llm_json.get("starter_code", func_data['code']),
                "hints": llm_json.get("hints", []),
                "time_limit_minutes": 10,
                "language": func_data['language'],
                "tokens_used": tokens,
                "model_used": model
            }

        except Exception as e:
            logger.error(f"[ChallengeGen] LLM challenge generation failed: {e}")
            return self._generate_fallback_challenge(func_data.get('language', 'python'))

    def _generate_fallback_challenge(self, language: str) -> Dict[str, Any]:
        """Fallback challenge when LLM generation fails or no functions found"""

        if language == "javascript":
            return {
                "original_code": "// No extractable function found in project",
                "filename": "challenge.js",
                "function_name": "transformArray",
                "challenge_description": "Write a function that transforms an array by doubling even numbers and tripling odd numbers.",
                "requirements": [
                    "Accept an array of integers",
                    "Double all even numbers",
                    "Triple all odd numbers",
                    "Return the new array"
                ],
                "test_cases": [
                    {"input": {"arr": [1, 2, 3, 4]}, "expected_output": [3, 4, 9, 8], "description": "Mixed even and odd"},
                    {"input": {"arr": [2, 4, 6]}, "expected_output": [4, 8, 12], "description": "All even"},
                    {"input": {"arr": []}, "expected_output": [], "description": "Empty array"},
                ],
                "starter_code": "function transformArray(arr) {\n  // Your code here\n}",
                "hints": ["Use .map() for clean iteration"],
                "time_limit_minutes": 10,
                "language": "javascript",
                "tokens_used": 0,
                "model_used": "fallback"
            }

        # Default: Python
        return {
            "original_code": "# No extractable function found in project",
            "filename": "challenge.py",
            "function_name": "transform_list",
            "challenge_description": "Write a function that transforms a list by doubling even numbers and tripling odd numbers.",
            "requirements": [
                "Accept a list of integers",
                "Double all even numbers",
                "Triple all odd numbers",
                "Return the new list"
            ],
            "test_cases": [
                {"input": {"nums": [1, 2, 3, 4]}, "expected_output": [3, 4, 9, 8], "description": "Mixed even and odd"},
                {"input": {"nums": [2, 4, 6]}, "expected_output": [4, 8, 12], "description": "All even"},
                {"input": {"nums": []}, "expected_output": [], "description": "Empty list"},
            ],
            "starter_code": "def transform_list(nums):\n    # Your code here\n    pass",
            "hints": ["Use list comprehension with a conditional expression"],
            "time_limit_minutes": 10,
            "language": "python",
            "tokens_used": 0,
            "model_used": "fallback"
        }
