"""
PHASE 7 — LIVE CODING CHALLENGE ENGINE
challengeGenerator.py

Generates coding challenges derived from the actual repository.
Tasks are based on real functions: modify, debug, or implement a missing feature.
Evaluates student responses by correctness, speed, and style similarity.
"""

import re
import ast
import random
import hashlib
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field


# ─────────────────────────────────────────────────
# DATA MODELS
# ─────────────────────────────────────────────────

@dataclass
class ChallengeTestCase:
    input: Dict[str, Any]
    expected_output: Any
    description: str = ""


@dataclass
class Challenge:
    challenge_id: str
    challenge_type: str          # modify | debug | implement
    title: str
    description: str
    starter_code: str
    test_cases: List[ChallengeTestCase]
    source_file: str
    source_function: str
    language: str                # python | javascript
    difficulty: str              # easy | medium | hard
    time_limit_seconds: int = 300
    expected_style_signature: str = ""   # Style fingerprint for comparison

    def to_dict(self) -> Dict[str, Any]:
        return {
            "challenge_id": self.challenge_id,
            "challenge_type": self.challenge_type,
            "title": self.title,
            "description": self.description,
            "starter_code": self.starter_code,
            "test_cases": [
                {"input": tc.input, "expected_output": tc.expected_output, "description": tc.description}
                for tc in self.test_cases
            ],
            "source_file": self.source_file,
            "source_function": self.source_function,
            "language": self.language,
            "difficulty": self.difficulty,
            "time_limit_seconds": self.time_limit_seconds,
        }


@dataclass
class ChallengeEvaluation:
    challenge_id: str
    correctness_score: float         # 0.0 – 1.0 (test pass rate)
    speed_score: float               # 0.0 – 1.0 (time taken vs limit)
    style_similarity: float          # 0.0 – 1.0 (vs original repo style)
    overall_score: float             # Weighted composite
    verdict: str                     # PASS | FAIL | PARTIAL
    passed_tests: int = 0
    total_tests: int = 0
    analysis: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "challenge_id": self.challenge_id,
            "correctness_score": round(self.correctness_score, 3),
            "speed_score": round(self.speed_score, 3),
            "style_similarity": round(self.style_similarity, 3),
            "overall_score": round(self.overall_score, 3),
            "verdict": self.verdict,
            "passed_tests": self.passed_tests,
            "total_tests": self.total_tests,
            "analysis": self.analysis,
        }


# ─────────────────────────────────────────────────
# CHALLENGE GENERATORS
# ─────────────────────────────────────────────────

class PythonChallengeBuilder:
    """Generates Python coding challenges from parsed functions."""

    def build_implement_challenge(
        self, func_name: str, func_body: str, source_file: str
    ) -> Optional[Challenge]:
        """Generate an 'implement the missing function' challenge."""
        
        # Parse the function to understand its signature
        try:
            tree = ast.parse(func_body)
        except SyntaxError:
            return None

        func_node = None
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                func_node = node
                break

        if not func_node:
            return None

        # Generate stub (remove body, keep signature + docstring if any)
        params = [arg.arg for arg in func_node.args.args]
        param_str = ", ".join(params) if params else ""
        
        starter_code = f'''def {func_name}({param_str}):
    """
    Implement this function based on the following specification:
    This function is part of your project at {source_file}.
    Complete the implementation below.
    """
    # Your implementation here
    pass
'''

        # Generate test cases based on common patterns
        test_cases = self._infer_test_cases_from_body(func_name, func_body, params)
        if not test_cases:
            return None

        challenge_id = hashlib.md5(f"{source_file}:{func_name}".encode()).hexdigest()[:12]

        return Challenge(
            challenge_id=challenge_id,
            challenge_type="implement",
            title=f"Implement `{func_name}` from {source_file.split('/')[-1]}",
            description=(
                f"This function originally lives in your project at `{source_file}`. "
                f"Implement `{func_name}({param_str})` to pass all test cases. "
                f"Your implementation should match the behavior you designed in your project."
            ),
            starter_code=starter_code,
            test_cases=test_cases,
            source_file=source_file,
            source_function=func_name,
            language="python",
            difficulty="medium",
            time_limit_seconds=300,
            expected_style_signature=self._extract_style_signature(func_body),
        )

    def build_debug_challenge(
        self, func_name: str, func_body: str, source_file: str
    ) -> Optional[Challenge]:
        """
        Phase 6: Metacognitive Verification System
        Deliberately injects a subtle bug into the student's own implementation.
        """
        mutation_patterns = [
            (r'(\s+)==(\s+)', r'\1!=\2', "Flipped equality operator"),
            (r'(\s+)<(\s+)', r'\1<=\2', "Changed strict less-than to less-than-inclusive"),
            (r'(\s+)and(\s+)', r'\1or\2', "Flipped AND to OR"),
            (r'return True', r'return False', "Inverted boolean return"),
            (r'return False', r'return True', "Inverted boolean return"),
            (r'\[0\]', r'[1]', "Changed 0-index to 1-index"),
            (r'\[-1\]', r'[-2]', "Changed tail grab offset"),
        ]
        
        lines = func_body.split('\n')
        mutated = False
        import random
        random.shuffle(mutation_patterns)
        
        for search, replace, reason in mutation_patterns:
            indices = list(range(len(lines)))
            random.shuffle(indices)
            for idx in indices:
                if re.search(search, lines[idx]):
                    lines[idx] = re.sub(search, replace, lines[idx], count=1)
                    mutated = True
                    break
            if mutated: break
            
        if not mutated:
            # Fallback mutation
            for idx in reversed(range(len(lines))):
                if 'return' in lines[idx]:
                    lines[idx] = lines[idx].replace('return', 'pass # return')
                    mutated = True
                    break

        if not mutated: return None
        
        mutated_code = '\n'.join(lines)
        
        try:
            tree = ast.parse(func_body)
            params = []
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    params = [arg.arg for arg in node.args.args]
                    break
        except SyntaxError:
            params = []
            
        test_cases = self._infer_test_cases_from_body(func_name, func_body, params)
        if not test_cases: return None
        
        challenge_id = hashlib.md5(f"{source_file}:{func_name}:debug".encode()).hexdigest()[:12]
        
        return Challenge(
            challenge_id=challenge_id,
            challenge_type="debug",
            title=f"Debug Your Code: `{func_name}`",
            description=(
                f"We injected a subtle bug into your `{func_name}` implementation from `{source_file}`.\n"
                f"Fix the bug to make the code pass all its original tests. This verifies your metacognitive understanding."
            ),
            starter_code=mutated_code,
            test_cases=test_cases,
            source_file=source_file,
            source_function=func_name,
            language="python",
            difficulty="hard",
            time_limit_seconds=300,
            expected_style_signature=self._extract_style_signature(func_body),
        )

    def _infer_test_cases_from_body(
        self, func_name: str, body: str, params: List[str]
    ) -> List[ChallengeTestCase]:
        """Infer test cases from function semantics."""
        test_cases = []

        # Detect common function patterns and generate appropriate tests
        body_lower = body.lower()

        if "sort" in func_name.lower() or "sort" in body_lower:
            test_cases = [
                ChallengeTestCase(
                    input={"arr" if not params else params[0]: [3, 1, 4, 1, 5, 9, 2, 6]},
                    expected_output=[1, 1, 2, 3, 4, 5, 6, 9],
                    description="Sort an array of integers"
                ),
                ChallengeTestCase(
                    input={"arr" if not params else params[0]: []},
                    expected_output=[],
                    description="Handle empty array"
                ),
            ]
        elif "fibonacci" in func_name.lower() or "fib" in func_name.lower():
            test_cases = [
                ChallengeTestCase(input={"n" if not params else params[0]: 0}, expected_output=0, description="Fib(0)"),
                ChallengeTestCase(input={"n" if not params else params[0]: 1}, expected_output=1, description="Fib(1)"),
                ChallengeTestCase(input={"n" if not params else params[0]: 10}, expected_output=55, description="Fib(10)"),
            ]
        elif "factorial" in func_name.lower():
            test_cases = [
                ChallengeTestCase(input={"n" if not params else params[0]: 0}, expected_output=1, description="0!"),
                ChallengeTestCase(input={"n" if not params else params[0]: 5}, expected_output=120, description="5!"),
            ]
        elif "reverse" in func_name.lower():
            param = params[0] if params else "s"
            test_cases = [
                ChallengeTestCase(input={param: "hello"}, expected_output="olleh", description="Reverse string"),
                ChallengeTestCase(input={param: ""}, expected_output="", description="Empty string"),
            ]
        elif "max" in func_name.lower() or "min" in func_name.lower():
            param = params[0] if params else "arr"
            expected = 9 if "max" in func_name.lower() else 1
            test_cases = [
                ChallengeTestCase(input={param: [3, 1, 4, 1, 5, 9, 2, 6]}, expected_output=expected, description="Find max/min"),
                ChallengeTestCase(input={param: [42]}, expected_output=42, description="Single element"),
            ]
        elif "sum" in func_name.lower() or "total" in func_name.lower():
            param = params[0] if params else "numbers"
            test_cases = [
                ChallengeTestCase(input={param: [1, 2, 3, 4, 5]}, expected_output=15, description="Sum array"),
                ChallengeTestCase(input={param: []}, expected_output=0, description="Empty array"),
            ]
        else:
            # Generic: generate a simple pass-through test
            if params:
                test_cases = [
                    ChallengeTestCase(
                        input={params[0]: "test_input"},
                        expected_output=None,
                        description="(From your specific implementation)",
                    )
                ]

        return test_cases

    def _extract_style_signature(self, code: str) -> str:
        """Extract a style fingerprint from the code."""
        style_features = []
        style_features.append("tabs" if "\t" in code else "spaces")
        style_features.append("single" if code.count("'") > code.count('"') else "double")
        lines = [l for l in code.splitlines() if l.strip()]
        avg_len = sum(len(l) for l in lines) / max(1, len(lines))
        style_features.append(f"avg_len:{int(avg_len)}")
        return "|".join(style_features)


class JSChallengeBuilder:
    """Generates JavaScript/TypeScript coding challenges."""

    def build_implement_challenge(
        self, func_name: str, func_body: str, source_file: str
    ) -> Optional[Challenge]:
        """Generate a JS implementation challenge."""
        
        # Extract parameters from function signature
        match = re.search(r"(?:function\s+\w+|const\s+\w+\s*=)\s*\(([^)]*)\)", func_body)
        params_str = match.group(1) if match else ""
        params = [p.strip().split(":")[0].strip() for p in params_str.split(",") if p.strip()]

        starter_code = f"""/**
 * Implement this function from your project at {source_file}
 * @param {{{", ".join(params)}}} parameters
 */
function {func_name}({", ".join(params)}) {{
    // Your implementation here
}}
"""

        test_cases = self._infer_test_cases(func_name, params)
        if not test_cases:
            return None

        challenge_id = hashlib.md5(f"{source_file}:{func_name}".encode()).hexdigest()[:12]

        return Challenge(
            challenge_id=challenge_id,
            challenge_type="implement",
            title=f"Implement `{func_name}` from {source_file.split('/')[-1]}",
            description=(
                f"Implement `{func_name}` which exists in your project at `{source_file}`. "
                f"Your implementation must pass all provided test cases."
            ),
            starter_code=starter_code,
            test_cases=test_cases,
            source_file=source_file,
            source_function=func_name,
            language="javascript",
            difficulty="medium",
            time_limit_seconds=300,
        )

    def _infer_test_cases(self, func_name: str, params: List[str]) -> List[ChallengeTestCase]:
        first_param = params[0] if params else "input"

        if "sort" in func_name.lower():
            return [
                ChallengeTestCase(input={first_param: [5, 2, 8, 1, 9]}, expected_output=[1, 2, 5, 8, 9]),
                ChallengeTestCase(input={first_param: []}, expected_output=[]),
            ]
        elif "reverse" in func_name.lower():
            return [
                ChallengeTestCase(input={first_param: "hello"}, expected_output="olleh"),
            ]
        elif "fibonacci" in func_name.lower() or "fib" in func_name.lower():
            return [
                ChallengeTestCase(input={first_param: 0}, expected_output=0),
                ChallengeTestCase(input={first_param: 10}, expected_output=55),
            ]
        return []


# ─────────────────────────────────────────────────
# STYLE COMPARATOR
# ─────────────────────────────────────────────────

class StyleComparator:
    """Compare student submission style against original repository style."""

    def compute_style_similarity(
        self, student_code: str, reference_signature: str
    ) -> float:
        """
        Compare style of student submission to original code style.
        Returns 0.0 – 1.0.
        """
        if not reference_signature:
            return 0.5  # Neutral when no reference

        # Extract student style
        student_sig = self._extract_signature(student_code)
        ref_parts = reference_signature.split("|")
        stu_parts = student_sig.split("|")

        matches = sum(1 for a, b in zip(ref_parts, stu_parts) if a == b)
        total = max(len(ref_parts), len(stu_parts))

        return matches / total if total > 0 else 0.5

    def _extract_signature(self, code: str) -> str:
        features = []
        features.append("tabs" if "\t" in code else "spaces")
        features.append("single" if code.count("'") > code.count('"') else "double")
        lines = [l for l in code.splitlines() if l.strip()]
        avg_len = sum(len(l) for l in lines) / max(1, len(lines))
        features.append(f"avg_len:{int(avg_len)}")
        return "|".join(features)


# ─────────────────────────────────────────────────
# MAIN CHALLENGE GENERATOR
# ─────────────────────────────────────────────────

class ChallengeGenerator:
    """
    Phase 7: Live Coding Challenge Engine.
    
    Derives challenges from the submitted repository.
    Evaluates submissions on correctness, speed, and style consistency.
    """

    def __init__(self, llm_provider=None):
        self.llm = llm_provider
        self.py_builder = PythonChallengeBuilder()
        self.js_builder = JSChallengeBuilder()
        self.style_comparator = StyleComparator()

    def generate_from_project_map(
        self, project_map: Any, difficulty: str = "medium"
    ) -> Optional[Dict[str, Any]]:
        """
        Generate a challenge from a ProjectMap object.
        Existing integration point for the Orchestrator.
        """
        if not hasattr(project_map, "files") or not project_map.files:
            return self._generate_generic_challenge()

        # Find best candidate file and function
        candidates = []
        for pf in project_map.files:
            if not hasattr(pf, "functions") or not pf.functions:
                continue
            ext = pf.path.rsplit(".", 1)[-1] if "." in pf.path else ""
            for func in pf.functions:
                if len(func.body) > 100:  # Skip trivial functions
                    candidates.append((pf.path, func.name, func.body, ext))

        if not candidates:
            return self._generate_generic_challenge()

        # Pick a random candidate
        source_file, func_name, func_body, ext = random.choice(candidates)

        challenge = None
        # 50% chance to generate an 'implement' challenge, 50% chance for 'debug' challenge (Phase 6)
        if ext == "py":
            if random.random() > 0.5:
                challenge = self.py_builder.build_debug_challenge(func_name, func_body, source_file)
            if not challenge:
                challenge = self.py_builder.build_implement_challenge(func_name, func_body, source_file)
        elif ext in ("js", "ts", "tsx", "jsx"):
            challenge = self.js_builder.build_implement_challenge(func_name, func_body, source_file)

        if challenge:
            return challenge.to_dict()

        return self._generate_generic_challenge()

    def generate_from_repo_profile(
        self, repo_profile: Dict[str, Any], difficulty: str = "medium"
    ) -> List[Dict[str, Any]]:
        """
        Generate challenges from a RepositoryProfile dict.
        Returns multiple challenges for a full challenge set.
        """
        files = repo_profile.get("file_nodes", [])
        algorithms = repo_profile.get("detected_algorithms", {})
        challenges = []

        # Algorithm-specific challenges
        for algo in list(algorithms.keys())[:2]:
            challenge = self._generate_algorithm_challenge(algo, files)
            if challenge:
                challenges.append(challenge.to_dict())

        # Generic implementation challenges
        for file_data in files[:3]:
            funcs = file_data.get("functions", [])
            path = file_data.get("path", "")
            ext = file_data.get("extension", "").lstrip(".")

            if not funcs:
                continue

            func_name = random.choice(funcs)
            challenge = None

            if ext == "py":
                # Use generic body for now
                challenge = self.py_builder.build_implement_challenge(
                    func_name, f"def {func_name}():\n    pass", path
                )
            elif ext in ("js", "ts", "tsx", "jsx"):
                challenge = self.js_builder.build_implement_challenge(
                    func_name, f"function {func_name}() {{}}", path
                )

            if challenge:
                challenges.append(challenge.to_dict())

        if not challenges:
            challenges = [self._generate_generic_challenge()]

        return challenges[:5]

    def _generate_algorithm_challenge(
        self, algo: str, files: List[Dict]
    ) -> Optional[Challenge]:
        """Generate a focused challenge on a detected algorithm."""
        algo_challenges = {
            "sorting": Challenge(
                challenge_id=hashlib.md5(b"sorting").hexdigest()[:12],
                challenge_type="implement",
                title="Sort Algorithm Implementation",
                description="Implement a sorting algorithm as used in your project. Sort the given array in ascending order.",
                starter_code="def sort_array(arr):\n    # Your implementation here\n    pass",
                test_cases=[
                    ChallengeTestCase({"arr": [5, 2, 8, 1, 9, 3]}, [1, 2, 3, 5, 8, 9], "Sort numbers"),
                    ChallengeTestCase({"arr": []}, [], "Empty array"),
                    ChallengeTestCase({"arr": [1]}, [1], "Single element"),
                ],
                source_file="your-project", source_function="sort_array",
                language="python", difficulty="easy",
            ),
            "graph_traversal": Challenge(
                challenge_id=hashlib.md5(b"graph").hexdigest()[:12],
                challenge_type="implement",
                title="Graph BFS Implementation",
                description="Implement BFS traversal as used in your routing/graph module. Return nodes in BFS order.",
                starter_code="from collections import deque\n\ndef bfs(graph, start):\n    # Your BFS here\n    pass",
                test_cases=[
                    ChallengeTestCase(
                        {"graph": {"A": ["B", "C"], "B": ["D"], "C": [], "D": []}, "start": "A"},
                        ["A", "B", "C", "D"],
                        "BFS from A"
                    ),
                ],
                source_file="your-project", source_function="bfs",
                language="python", difficulty="medium",
            ),
            "dynamic_programming": Challenge(
                challenge_id=hashlib.md5(b"dp").hexdigest()[:12],
                challenge_type="implement",
                title="DP: Fibonacci with Memoization",
                description="Implement Fibonacci using memoization, as in your project's DP module.",
                starter_code="def fibonacci(n, memo={}):\n    # Your DP implementation here\n    pass",
                test_cases=[
                    ChallengeTestCase({"n": 0}, 0),
                    ChallengeTestCase({"n": 1}, 1),
                    ChallengeTestCase({"n": 10}, 55),
                    ChallengeTestCase({"n": 20}, 6765),
                ],
                source_file="your-project", source_function="fibonacci",
                language="python", difficulty="easy",
            ),
        }
        return algo_challenges.get(algo)

    def evaluate_submission(
        self,
        challenge: Dict[str, Any],
        student_code: str,
        execution_result: Dict[str, Any],
        time_taken_seconds: float,
    ) -> ChallengeEvaluation:
        """
        Evaluate a student's challenge submission.
        """
        challenge_id = challenge.get("challenge_id", "unknown")
        total_tests = execution_result.get("total_tests", 0)
        passed_tests = execution_result.get("passed_tests", 0)
        
        # Correctness score
        correctness = passed_tests / max(1, total_tests)

        # Speed score (linear decay from 0 to time_limit)
        time_limit = challenge.get("time_limit_seconds", 300)
        speed_score = max(0.0, 1.0 - (time_taken_seconds / time_limit))

        # Style similarity
        ref_sig = challenge.get("expected_style_signature", "")
        style_sim = self.style_comparator.compute_style_similarity(student_code, ref_sig)

        # Composite score
        overall = (
            correctness * 0.60
            + speed_score * 0.20
            + style_sim * 0.20
        )

        analysis = []
        if correctness < 0.5:
            analysis.append("Failed more than half of test cases")
        if speed_score < 0.3:
            analysis.append("Took significantly longer than expected")
        if style_sim < 0.3:
            analysis.append("Code style differs significantly from original repository (may not be same author)")

        verdict = "PASS" if correctness >= 0.7 else ("PARTIAL" if correctness >= 0.4 else "FAIL")

        return ChallengeEvaluation(
            challenge_id=challenge_id,
            correctness_score=correctness,
            speed_score=speed_score,
            style_similarity=style_sim,
            overall_score=overall,
            verdict=verdict,
            passed_tests=passed_tests,
            total_tests=total_tests,
            analysis=analysis,
        )

    def _generate_generic_challenge(self) -> Dict[str, Any]:
        """Fallback generic challenge when no project data is available."""
        challenge = Challenge(
            challenge_id="generic_001",
            challenge_type="implement",
            title="Two Sum Problem",
            description=(
                "Given an array of integers and a target, return indices of two numbers "
                "that add up to target. Assume exactly one solution exists."
            ),
            starter_code="def two_sum(nums, target):\n    # Your implementation\n    pass",
            test_cases=[
                ChallengeTestCase({"nums": [2, 7, 11, 15], "target": 9}, [0, 1], "Basic case"),
                ChallengeTestCase({"nums": [3, 2, 4], "target": 6}, [1, 2], "Non-sequential"),
                ChallengeTestCase({"nums": [3, 3], "target": 6}, [0, 1], "Duplicate values"),
            ],
            source_file="generic", source_function="two_sum",
            language="python", difficulty="easy", time_limit_seconds=180,
        )
        return challenge.to_dict()
