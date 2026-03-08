"""
Code Quality & Documentation Analysis Agent (Layers 8, 9, 10, 11)

Performs multi-dimensional code quality analysis:
  - Documentation authenticity (README, comments)
  - Dependency analysis (package.json, requirements.txt)
  - Test coverage analysis
  - Code cleanliness/smell detection
  - Skill level estimation
"""

import re
import json
from typing import Dict, Any, List
from dataclasses import dataclass, field
from engine.agents.base_agent import BaseAgent
from engine.models.signals import ProjectMap


@dataclass
class CodeQualitySignal:
    """Combined output from code quality analysis."""
    # Documentation
    documentation_authenticity: float = 50.0
    writing_style: str = "unknown"  # student | corporate | tutorial | ai_generated
    doc_red_flags: List[str] = field(default_factory=list)
    
    # Dependencies
    dependency_appropriateness: str = "unknown"  # suspicious | appropriate | minimal
    overengineered_tooling: bool = False
    unused_deps_detected: bool = False
    professional_setup_detected: bool = False
    dep_flags: List[str] = field(default_factory=list)
    
    # Tests
    test_sophistication: str = "none"  # none | basic | intermediate | professional
    suspicious_test_quality: bool = False
    test_flags: List[str] = field(default_factory=list)
    
    # Code Cleanliness
    code_cleanliness: str = "appropriate"  # too_perfect | appropriate | inconsistent | messy
    cleanliness_score: float = 50.0
    smell_flags: List[str] = field(default_factory=list)
    
    # Skill Level
    estimated_skill_level: str = "intermediate"  # beginner | intermediate | advanced | expert
    complexity_score: float = 0.0
    skill_flags: List[str] = field(default_factory=list)


class CodeQualityAgent(BaseAgent):
    """
    Agent: Code Quality & Documentation Analyzer
    
    Evaluates code quality signals that indicate whether a project 
    was authored by the claimed student or sourced externally.
    """

    def __init__(self):
        super().__init__(name="CodeQuality")

    def analyze(self, payload) -> Dict[str, Any]:
        if not isinstance(payload, ProjectMap):
            return vars(CodeQualitySignal())

        project_map: ProjectMap = payload
        signal = CodeQualitySignal()

        if not project_map.files:
            return vars(signal)

        all_code = ""
        all_paths = []
        readme_content = ""
        package_json = ""
        requirements_txt = ""
        test_files = []

        for f in project_map.files:
            all_code += f.content + "\n"
            all_paths.append(f.path)
            lower_path = f.path.lower()

            if "readme" in lower_path:
                readme_content = f.content
            elif lower_path.endswith("package.json") and "node_modules" not in lower_path:
                package_json = f.content
            elif lower_path.endswith("requirements.txt"):
                requirements_txt = f.content
            elif any(t in lower_path for t in ["test", "spec", "__tests__"]):
                test_files.append(f)

        # Run all analysis dimensions
        self._analyze_documentation(signal, readme_content, all_code)
        self._analyze_dependencies(signal, package_json, requirements_txt, all_paths)
        self._analyze_tests(signal, test_files, all_code)
        self._analyze_cleanliness(signal, all_code, project_map)
        self._estimate_skill_level(signal, all_code, all_paths, project_map)

        return vars(signal)

    # ============================================================
    # DOCUMENTATION ANALYSIS (Layer 8)
    # ============================================================
    def _analyze_documentation(self, signal: CodeQualitySignal, readme: str, code: str):
        authenticity = 70.0  # Start neutral-positive
        flags = []

        if not readme:
            signal.documentation_authenticity = 30.0
            signal.writing_style = "unknown"
            signal.doc_red_flags = ["No README found"]
            return

        readme_lower = readme.lower()

        # AI-generated README indicators
        ai_phrases = [
            "this project demonstrates", "getting started", "prerequisites",
            "installation", "built with", "contributing", "pull requests",
            "leverages", "seamlessly", "robust and scalable",
            "architecture overview", "key features", "table of contents",
        ]
        ai_hits = sum(1 for p in ai_phrases if p in readme_lower)

        if ai_hits >= 5:
            authenticity -= 30
            flags.append(f"README uses {ai_hits} AI-template phrases")
            signal.writing_style = "ai_generated"
        elif ai_hits >= 3:
            authenticity -= 15
            flags.append(f"README has {ai_hits} template phrases")
            signal.writing_style = "corporate"

        # Student authenticity indicators
        student_phrases = [
            "i learned", "was tricky", "struggled", "figured out",
            "thanks to", "my first", "this was hard", "broke everything",
            "finally works", "not sure why", "might break",
        ]
        student_hits = sum(1 for p in student_phrases if p in readme_lower)
        if student_hits >= 2:
            authenticity += 20
            signal.writing_style = "student"
        elif student_hits >= 1:
            authenticity += 10

        # Check for perfect structure (Table of Contents, Badges, etc.)
        has_badges = bool(re.search(r'!\[.*?\]\(https?://(?:img\.shields|badge)', readme))
        has_toc = "table of contents" in readme_lower
        has_license = "license" in readme_lower and "mit" in readme_lower

        if has_badges and has_toc:
            authenticity -= 15
            flags.append("README has badges + ToC (professional template)")

        # Check for grammar perfection vs typos
        # Simple heuristic: very long README with zero casual language = suspicious
        if len(readme) > 2000 and student_hits == 0:
            authenticity -= 10
            flags.append("Long README with zero personal voice")

        signal.documentation_authenticity = max(0, min(100, authenticity))
        signal.doc_red_flags = flags

    # ============================================================
    # DEPENDENCY ANALYSIS (Layer 9)
    # ============================================================
    def _analyze_dependencies(self, signal: CodeQualitySignal, pkg_json: str,
                               req_txt: str, paths: List[str]):
        flags = []

        # NPM analysis
        if pkg_json:
            try:
                pkg = json.loads(pkg_json)
                deps = pkg.get("dependencies", {})
                dev_deps = pkg.get("devDependencies", {})
                all_deps = {**deps, **dev_deps}

                # Enterprise packages in student project
                enterprise_pkgs = [
                    "winston", "pino", "pm2", "helmet", "compression",
                    "rate-limiter", "express-rate-limit", "bull", "ioredis",
                    "sentry", "@sentry/node", "newrelic", "datadog",
                    "husky", "lint-staged", "commitlint", "semantic-release",
                ]
                enterprise_hits = [p for p in enterprise_pkgs if p in all_deps]

                if len(enterprise_hits) >= 3:
                    signal.overengineered_tooling = True
                    flags.append(f"Enterprise packages: {', '.join(enterprise_hits)}")
                    signal.dependency_appropriateness = "suspicious"
                elif len(enterprise_hits) >= 1:
                    flags.append(f"Professional packages: {', '.join(enterprise_hits)}")

                # Too many dependencies
                dep_count = len(deps)
                if dep_count > 25:
                    flags.append(f"{dep_count} dependencies (excessive for student project)")
                    signal.dependency_appropriateness = "suspicious"

                # Professional config files
                pro_configs = [
                    ".prettierrc", ".eslintrc", ".editorconfig",
                    "tsconfig.json", "jest.config", ".nvmrc",
                    "commitlint.config", ".husky",
                ]
                pro_count = sum(1 for p in paths for c in pro_configs if c in p.lower())
                if pro_count >= 4:
                    signal.professional_setup_detected = True
                    flags.append(f"{pro_count} professional config files detected")

                if not flags:
                    signal.dependency_appropriateness = "appropriate"

            except json.JSONDecodeError:
                pass

        # Python requirements analysis
        if req_txt:
            pkgs = [l.strip().split("==")[0].split(">=")[0] for l in req_txt.split("\n") if l.strip() and not l.startswith("#")]
            enterprise_py = ["celery", "redis", "sentry-sdk", "newrelic", "gunicorn", "supervisor"]
            hits = [p for p in enterprise_py if p in pkgs]
            if hits:
                flags.append(f"Production Python packages: {', '.join(hits)}")

        signal.dep_flags = flags

    # ============================================================
    # TEST ANALYSIS (Layer 10)
    # ============================================================
    def _analyze_tests(self, signal: CodeQualitySignal, test_files: list, code: str):
        flags = []

        if not test_files:
            signal.test_sophistication = "none"
            return

        test_code = "\n".join(f.content for f in test_files)
        test_lines = len(test_code.split("\n"))

        # Sophistication check
        advanced_patterns = [
            (r'mock|Mock|jest\.fn|patch|MagicMock', "Mocking/spying"),
            (r'fixture|conftest|beforeAll|afterAll', "Test fixtures"),
            (r'describe.*describe|context.*context', "Nested test suites"),
            (r'expect\(.*\)\.rejects|assertRaises', "Error case testing"),
            (r'parametrize|test\.each|\.each\b', "Parameterized tests"),
            (r'coverage|--cov|istanbul', "Coverage tooling"),
        ]

        advanced_count = 0
        for pattern, desc in advanced_patterns:
            if re.search(pattern, test_code, re.IGNORECASE):
                advanced_count += 1
                flags.append(f"Advanced: {desc}")

        if advanced_count >= 4:
            signal.test_sophistication = "professional"
            signal.suspicious_test_quality = True
            flags.append("Test quality matches production codebase")
        elif advanced_count >= 2:
            signal.test_sophistication = "intermediate"
        elif test_files:
            signal.test_sophistication = "basic"

        signal.test_flags = flags

    # ============================================================
    # CODE CLEANLINESS (Layer 11)
    # ============================================================
    def _analyze_cleanliness(self, signal: CodeQualitySignal, code: str, pm: ProjectMap):
        flags = []
        total_funcs = sum(len(f.functions) for f in pm.files)

        if total_funcs == 0:
            return

        # Average function length
        func_sizes = [f.size for pf in pm.files for f in pf.functions if f.size > 0]
        if func_sizes:
            avg_size = sum(func_sizes) / len(func_sizes)
            max_size = max(func_sizes)

            if avg_size < 15 and max_size < 30 and len(func_sizes) > 5:
                signal.code_cleanliness = "too_perfect"
                flags.append(f"Average function length {avg_size:.0f} lines (unusually short)")
                flags.append("All functions follow Single Responsibility (too SOLID for student)")
            elif avg_size > 60:
                signal.code_cleanliness = "messy"
                flags.append(f"Average function length {avg_size:.0f} lines (very long)")

        # Magic numbers check (good code avoids these)
        magic_numbers = re.findall(r'(?<!=)\s+(?:(?!0|1|-1)\d{2,})\s*[;,)\]}]', code)
        if not magic_numbers and total_funcs > 5:
            flags.append("Zero magic numbers (too clean)")

        # Nested conditionals (messy, but authentic)
        deep_nesting = len(re.findall(r'if.*\n\s+if.*\n\s+if', code))
        if deep_nesting == 0 and total_funcs > 10:
            flags.append("No nested conditionals (unusually flat code)")

        signal.cleanliness_score = 50.0  # neutral baseline
        if signal.code_cleanliness == "too_perfect":
            signal.cleanliness_score = 90.0
        elif signal.code_cleanliness == "messy":
            signal.cleanliness_score = 20.0

        signal.smell_flags = flags

    # ============================================================
    # SKILL LEVEL ESTIMATION
    # ============================================================
    def _estimate_skill_level(self, signal: CodeQualitySignal, code: str,
                               paths: List[str], pm: ProjectMap):
        complexity = 0.0
        flags = []

        total_lines = len(code.split("\n"))
        total_files = len(paths)
        total_funcs = sum(len(f.functions) for f in pm.files)

        # Scale scoring
        if total_lines > 3000:
            complexity += 3
        elif total_lines > 1000:
            complexity += 1.5

        if total_files > 30:
            complexity += 2
        elif total_files > 15:
            complexity += 1

        # Advanced patterns
        advanced = [
            (r'async\s+(?:def|function)', "Async/await"),
            (r'(?:useCallback|useMemo|useRef|useReducer)', "Advanced React hooks"),
            (r'middleware|interceptor', "Middleware patterns"),
            (r'WebSocket|socket\.io', "Real-time communication"),
            (r'(?:Redis|MongoDB|PostgreSQL|Prisma)', "Database integration"),
            (r'JWT|OAuth|passport', "Authentication systems"),
            (r'Docker|kubernetes|CI/CD', "DevOps tooling"),
            (r'GraphQL|Apollo|tRPC', "Advanced API patterns"),
        ]

        for pattern, desc in advanced:
            if re.search(pattern, code, re.IGNORECASE):
                complexity += 1.5
                flags.append(desc)

        # Determine level
        if complexity >= 10:
            signal.estimated_skill_level = "expert"
        elif complexity >= 6:
            signal.estimated_skill_level = "advanced"
        elif complexity >= 3:
            signal.estimated_skill_level = "intermediate"
        else:
            signal.estimated_skill_level = "beginner"

        signal.complexity_score = min(100.0, complexity * 10)
        signal.skill_flags = flags
