"""
AI-Generated Code Detection Agent (Layer 4)

Detects signatures of ChatGPT, Claude, GitHub Copilot, and other AI-generated code.
Uses heuristic pattern matching across 5 signal dimensions:
  1. Structural Signatures (enterprise patterns in simple projects)
  2. Linguistic Signatures (comment quality, naming conventions)
  3. Architectural Signatures (too-perfect separation of concerns)
  4. Behavioral Signatures (no refactoring history, perfect consistency)
  5. Content Signatures (boilerplate README, generic variable names)
"""

import re
import math
from typing import Dict, Any, List
from dataclasses import dataclass, field
from engine.agents.base_agent import BaseAgent
from engine.models.signals import ProjectMap


@dataclass
class AIDetectionSignal:
    """Output signal from the AI Detection Agent."""
    ai_generation_probability: float = 0.0
    confidence: str = "low"  # low | moderate | high | overwhelming
    likely_source: str = "Human"  # Human | ChatGPT | Claude | GitHub Copilot
    detected_patterns: List[str] = field(default_factory=list)
    evidence_strength: str = "weak"  # weak | moderate | strong | overwhelming
    # Detailed breakdown
    structural_score: float = 0.0
    linguistic_score: float = 0.0
    architectural_score: float = 0.0
    behavioral_score: float = 0.0
    content_score: float = 0.0
    human_authenticity_score: float = 100.0
    learning_artifacts_detected: bool = False
    psychological_flags: List[str] = field(default_factory=list)


class AIDetectionAgent(BaseAgent):
    """
    Agent: AI-Generated Code Detector
    
    Scans project files for telltale patterns of AI-generated code.
    Each pattern has a weight; total score determines probability.
    """

    def __init__(self):
        super().__init__(name="AIDetection")

        # ============================================================
        # WEIGHTED PATTERN DEFINITIONS
        # Each check returns (matched: bool, weight: int, description: str)
        # ============================================================

        # --- Structural Signatures (enterprise patterns in simple projects) ---
        self.structural_checks = [
            (r'\btry\s*[{:]\s*\n.*?\bcatch\b|\bexcept\b', 8,
             "Comprehensive error handling (AI signature)"),
            (r'@(dataclass|decorator|staticmethod|classmethod|property)', 5,
             "Heavy decorator usage"),
            (r'class\s+\w+Error\b|class\s+\w+Exception\b', 10,
             "Custom error classes (enterprise pattern)"),
            (r'(factory|strategy|observer|singleton|adapter)\s*pattern',  12,
             "Design patterns in simple project", True),  # case-insensitive
            (r'dependency\s*inject|DI\s*container', 10,
             "Dependency injection pattern"),
            (r'\.env\b.*validation|config\s*schema|zod\.', 8,
             "Config validation schemas"),
            (r'winston|pino|bunyan|log4j', 10,
             "Enterprise logging libraries"),
            (r'rate\s*limit|throttle|circuit\s*breaker', 10,
             "Production infrastructure patterns"),
        ]

        # --- Linguistic Signatures (comment/naming quality) ---
        self.linguistic_patterns = {
            "perfect_jsdoc": (r'/\*\*\s*\n\s*\*\s*@', 15, "JSDoc on every function (AI habit)"),
            "perfect_docstrings": (r'"""[\s\S]{20,}?"""', 8, "Detailed docstrings everywhere"),
            "why_comments": (r'//\s*(This|We|Note:|Important:|Ensure)', 6,
                             "Comments explain WHY not WHAT"),
            "no_abbreviations": (r'\b(usr|btn|txt|msg|req|res|cb|fn|args|opts)\b', -5,
                                 "Uses abbreviations (human sign)"),  # negative = human
            "leverages_utilizes": (r'\b(leverages?|utilizes?|seamlessly|robust|scalable)\b', 8,
                                   "Corporate buzzwords in comments"),
            "perfect_grammar": None,  # Checked separately
        }

        # --- Architectural Signatures ---
        self.architectural_indicators = [
            "components/common/", "components/shared/", "components/ui/",
            "hooks/", "utils/", "helpers/", "constants/", "services/",
            "middleware/", "config/", "types/", "interfaces/",
            "lib/", "__tests__/", "spec/", "fixtures/",
        ]

        # --- Content Signatures ---
        self.ai_readme_phrases = [
            "this project demonstrates", "getting started", "prerequisites",
            "built with", "contributing", "pull requests are welcome",
            "leverages", "seamlessly integrates", "robust and scalable",
            "this application provides", "key features include",
            "architecture overview",
        ]

        self.ai_variable_patterns = [
            r'\buserData\b', r'\bitemList\b', r'\bconfigOptions\b',
            r'\bapiResponse\b', r'\berrorMessage\b', r'\bisLoading\b',
            r'\bhandleSubmit\b', r'\bhandleChange\b', r'\bhandleClick\b',
            r'\bfetchData\b', r'\bsetIsLoading\b', r'\buseAuth\b',
        ]

    def analyze(self, payload) -> Dict[str, Any]:
        """
        Analyze a ProjectMap for AI-generated code signatures.
        Returns AIDetectionSignal as a dict.
        """
        if not isinstance(payload, ProjectMap):
            # If called with raw dict, return empty signal
            return vars(AIDetectionSignal())

        project_map: ProjectMap = payload
        signal = AIDetectionSignal()

        if not project_map.files:
            return vars(signal)

        # Aggregate all code content
        all_code = ""
        all_paths = []
        file_count = 0
        total_functions = 0
        code_files_content = {}

        for f in project_map.files:
            all_code += f.content + "\n"
            all_paths.append(f.path)
            file_count += 1
            total_functions += len(f.functions)
            code_files_content[f.path] = f.content

        if not all_code.strip():
            return vars(signal)

        # ============================================================
        # RUN ALL 5 DETECTION DIMENSIONS
        # ============================================================
        structural_hits = self._check_structural(all_code)
        linguistic_hits = self._check_linguistic(all_code, code_files_content)
        architectural_hits = self._check_architectural(all_paths)
        behavioral_hits = self._check_behavioral(all_code, code_files_content, total_functions)
        content_hits = self._check_content(all_code, all_paths)

        # ============================================================
        # HUMAN AUTHENTICITY CHECK (counterbalance)
        # ============================================================
        human_indicators = self._check_human_authenticity(all_code)

        # ============================================================
        # SCORE CALCULATION
        # ============================================================
        raw_ai_score = (
            structural_hits["score"] +
            linguistic_hits["score"] +
            architectural_hits["score"] +
            behavioral_hits["score"] +
            content_hits["score"]
        )

        # Subtract human indicators
        human_score = human_indicators["score"]
        net_score = max(0, raw_ai_score - human_score)

        # Normalize to 0-100 range (max theoretical ~150)
        ai_probability = min(100.0, round((net_score / 120.0) * 100, 1))

        # Determine confidence and source
        if ai_probability >= 80:
            confidence = "overwhelming"
            evidence_strength = "overwhelming"
        elif ai_probability >= 60:
            confidence = "high"
            evidence_strength = "strong"
        elif ai_probability >= 40:
            confidence = "moderate"
            evidence_strength = "moderate"
        else:
            confidence = "low"
            evidence_strength = "weak"

        likely_source = self._guess_ai_source(all_code, ai_probability)

        # Compile all detected patterns
        all_patterns = (
            structural_hits["patterns"] +
            linguistic_hits["patterns"] +
            architectural_hits["patterns"] +
            behavioral_hits["patterns"] +
            content_hits["patterns"]
        )

        # Build signal
        signal.ai_generation_probability = ai_probability
        signal.confidence = confidence
        signal.likely_source = likely_source
        signal.detected_patterns = all_patterns[:15]  # Cap at 15 most important
        signal.evidence_strength = evidence_strength
        signal.structural_score = min(100, structural_hits["score"] * 3)
        signal.linguistic_score = min(100, linguistic_hits["score"] * 3)
        signal.architectural_score = min(100, architectural_hits["score"] * 4)
        signal.behavioral_score = min(100, behavioral_hits["score"] * 3)
        signal.content_score = min(100, content_hits["score"] * 3)
        signal.human_authenticity_score = max(0, min(100, 100 - ai_probability + human_score))
        signal.learning_artifacts_detected = human_indicators["has_artifacts"]
        signal.psychological_flags = human_indicators.get("flags", [])

        return vars(signal)

    # ============================================================
    # DIMENSION 1: STRUCTURAL SIGNATURES
    # ============================================================
    def _check_structural(self, code: str) -> Dict:
        score = 0
        patterns = []

        for check in self.structural_checks:
            if len(check) == 4:
                pattern, weight, desc, case_insensitive = check
                flags = re.IGNORECASE | re.DOTALL
            else:
                pattern, weight, desc = check
                flags = re.DOTALL

            matches = re.findall(pattern, code, flags)
            if matches:
                hit_score = min(weight, weight * len(matches) // 2)
                score += hit_score
                patterns.append(f"[Structural] {desc} ({len(matches)} instances)")

        # Check error handling density
        try_count = len(re.findall(r'\btry\b', code))
        func_count = max(1, len(re.findall(r'\b(def |function |const \w+ = )', code)))
        eh_ratio = try_count / func_count
        if eh_ratio > 0.6:
            score += 12
            patterns.append(f"[Structural] Error handling in {int(eh_ratio*100)}% of functions (abnormally high)")

        return {"score": score, "patterns": patterns}

    # ============================================================
    # DIMENSION 2: LINGUISTIC SIGNATURES
    # ============================================================
    def _check_linguistic(self, code: str, files: Dict[str, str]) -> Dict:
        score = 0
        patterns = []

        for name, check in self.linguistic_patterns.items():
            if check is None:
                continue
            pattern, weight, desc = check
            matches = re.findall(pattern, code, re.IGNORECASE)
            if weight < 0:
                # Negative weight = human indicator, reduce AI score
                if matches:
                    score += weight  # subtracts
                    patterns.append(f"[Linguistic] Uses abbreviations (human sign, {len(matches)}x)")
            elif matches:
                score += min(weight, weight * len(matches) // 3)
                patterns.append(f"[Linguistic] {desc}")

        # Check comment-to-code ratio
        comment_lines = len(re.findall(r'(^\s*#|^\s*//|^\s*/\*|\*\s)', code, re.MULTILINE))
        total_lines = max(1, len(code.split('\n')))
        comment_ratio = comment_lines / total_lines
        if comment_ratio > 0.25:
            score += 10
            patterns.append(f"[Linguistic] Comment ratio {int(comment_ratio*100)}% (over-commented, AI signature)")

        # Check for zero typos in comments (AI never makes typos)
        comments = re.findall(r'(?://|#)\s*(.+)', code)
        if len(comments) > 10:
            # Simple heuristic: AI comments are always grammatically perfect
            avg_len = sum(len(c) for c in comments) / len(comments)
            if avg_len > 40:  # AI writes long, detailed comments
                score += 6
                patterns.append("[Linguistic] Comments are unusually detailed and lengthy")

        return {"score": score, "patterns": patterns}

    # ============================================================
    # DIMENSION 3: ARCHITECTURAL SIGNATURES
    # ============================================================
    def _check_architectural(self, paths: List[str]) -> Dict:
        score = 0
        patterns = []

        matched_dirs = []
        for indicator in self.architectural_indicators:
            for path in paths:
                normalized = path.replace("\\", "/").lower()
                if indicator.lower() in normalized:
                    matched_dirs.append(indicator.rstrip("/"))
                    break

        # Having 5+ enterprise directory patterns is suspicious
        if len(matched_dirs) >= 7:
            score += 20
            patterns.append(f"[Architecture] Enterprise folder structure ({', '.join(matched_dirs[:5])}...)")
        elif len(matched_dirs) >= 5:
            score += 12
            patterns.append(f"[Architecture] Professional folder structure ({', '.join(matched_dirs[:4])})")
        elif len(matched_dirs) >= 3:
            score += 5
            patterns.append(f"[Architecture] Organized folders ({', '.join(matched_dirs[:3])})")

        # Check for index.ts + types.ts pattern (very AI)
        has_index_pattern = any("index." in p.lower() for p in paths)
        has_types_pattern = any("types." in p.lower() or "interfaces." in p.lower() for p in paths)
        if has_index_pattern and has_types_pattern:
            score += 8
            patterns.append("[Architecture] Index + Types file pattern (AI-typical)")

        return {"score": score, "patterns": patterns}

    # ============================================================
    # DIMENSION 4: BEHAVIORAL SIGNATURES
    # ============================================================
    def _check_behavioral(self, code: str, files: Dict[str, str], func_count: int) -> Dict:
        score = 0
        patterns = []

        # Check style consistency across files
        if len(files) >= 3:
            styles = []
            for path, content in files.items():
                uses_semicolons = content.count(';') > 5
                uses_tabs = '\t' in content
                uses_double_quotes = content.count('"') > content.count("'")
                styles.append((uses_semicolons, uses_tabs, uses_double_quotes))

            # If ALL files have identical style = suspicious (humans are inconsistent)
            if len(set(styles)) == 1 and len(styles) >= 4:
                score += 10
                patterns.append("[Behavioral] Perfect style consistency across all files (inhuman)")

        # Check for debugging artifacts (human sign)
        debug_patterns = [
            r'console\.log\(', r'print\(.*debug', r'# ?TODO',
            r'// ?TODO', r'// ?FIXME', r'// ?HACK', r'# ?HACK',
            r'# ?XXX', r'debugger', r'pdb\.set_trace',
        ]
        debug_count = 0
        for dp in debug_patterns:
            debug_count += len(re.findall(dp, code, re.IGNORECASE))

        if debug_count == 0 and func_count > 5:
            score += 15
            patterns.append("[Behavioral] Zero debugging artifacts in entire codebase (very suspicious)")
        elif debug_count <= 1 and func_count > 10:
            score += 8
            patterns.append("[Behavioral] Almost no debugging artifacts")

        # Check for commented-out code (human sign of iteration)
        commented_code = re.findall(r'^\s*(?://|#)\s*(if|for|while|return|const|let|var|def|class)\b', code, re.MULTILINE)
        if not commented_code and func_count > 5:
            score += 6
            patterns.append("[Behavioral] No commented-out code (no iteration visible)")

        return {"score": score, "patterns": patterns}

    # ============================================================
    # DIMENSION 5: CONTENT SIGNATURES
    # ============================================================
    def _check_content(self, code: str, paths: List[str]) -> Dict:
        score = 0
        patterns = []

        # Check for AI-typical variable names
        ai_var_count = 0
        for var_pattern in self.ai_variable_patterns:
            matches = re.findall(var_pattern, code)
            ai_var_count += len(matches)

        if ai_var_count >= 8:
            score += 12
            patterns.append(f"[Content] {ai_var_count} AI-typical variable names (handleSubmit, fetchData, etc.)")
        elif ai_var_count >= 5:
            score += 6
            patterns.append(f"[Content] {ai_var_count} generic AI-style variable names")

        # Check README for AI phrases
        readme_content = ""
        for path in paths:
            if "readme" in path.lower():
                # Content was already aggregated, find it
                lower_code = code.lower()
                ai_phrase_count = 0
                for phrase in self.ai_readme_phrases:
                    if phrase in lower_code:
                        ai_phrase_count += 1
                if ai_phrase_count >= 4:
                    score += 12
                    patterns.append(f"[Content] README has {ai_phrase_count} AI-generated phrases")
                elif ai_phrase_count >= 2:
                    score += 5
                    patterns.append(f"[Content] README has generic template phrases")
                break

        # Check for perfect mock data
        mock_patterns = [
            r'john\.doe|jane\.doe|test@example\.com|123-456-7890',
            r'lorem ipsum|placeholder text|sample data',
        ]
        for mp in mock_patterns:
            if re.search(mp, code, re.IGNORECASE):
                score += 4
                patterns.append("[Content] Uses typical AI placeholder data")
                break

        return {"score": score, "patterns": patterns}

    # ============================================================
    # HUMAN AUTHENTICITY COUNTERBALANCE
    # ============================================================
    def _check_human_authenticity(self, code: str) -> Dict:
        score = 0
        flags = []
        has_artifacts = False

        # Debugging artifacts (strong human signal)
        debug_count = len(re.findall(r'console\.log|print\(|debugger|pdb', code, re.IGNORECASE))
        if debug_count >= 3:
            score += 15
            has_artifacts = True
            flags.append("Contains debugging artifacts (console.log, print)")

        # TODOs and FIXMEs
        todos = len(re.findall(r'TODO|FIXME|HACK|XXX|TEMP', code))
        if todos >= 2:
            score += 8
            has_artifacts = True
            flags.append(f"{todos} TODO/FIXME comments (human iteration)")

        # Commented-out code
        commented = len(re.findall(r'^\s*(?://|#)\s*(if|for|while|return|def|function|class)\b', code, re.MULTILINE))
        if commented >= 2:
            score += 10
            has_artifacts = True
            flags.append("Commented-out code visible (trial-and-error)")

        # Typos in variable names (very human)
        typo_patterns = [r'\btemp\b', r'\btmp\b', r'\bfoo\b', r'\bbar\b', r'\basdf\b', r'\btest\d+\b']
        for tp in typo_patterns:
            if re.search(tp, code):
                score += 3
                break

        # Abbreviations (humans abbreviate)
        abbrevs = len(re.findall(r'\b(usr|btn|txt|msg|idx|cnt|val|str|num|arr|obj|cfg|evt)\b', code))
        if abbrevs >= 5:
            score += 8
            flags.append("Uses abbreviations (human coding style)")

        # Inconsistent formatting (human)
        mixed_quotes = ('"' in code and "'" in code)
        if mixed_quotes:
            score += 3

        return {"score": score, "has_artifacts": has_artifacts, "flags": flags}

    # ============================================================
    # AI SOURCE GUESS
    # ============================================================
    def _guess_ai_source(self, code: str, probability: float) -> str:
        if probability < 30:
            return "Human"

        # ChatGPT signatures
        chatgpt_signs = sum([
            bool(re.search(r'/\*\*\s*\n\s*\*\s*@', code)),  # JSDoc
            bool(re.search(r'leverages?|utilizes?|seamlessly', code, re.IGNORECASE)),
            bool(re.search(r'robust|scalable|maintainable', code, re.IGNORECASE)),
            "handleSubmit" in code and "handleChange" in code,
        ])

        # Copilot signatures
        copilot_signs = sum([
            len(re.findall(r'// .*\n\s*(const|let|function|def)\b', code)) > 5,  # comment → code
            bool(re.search(r'TODO: implement|TODO: add', code, re.IGNORECASE)),
        ])

        # Claude signatures
        claude_signs = sum([
            bool(re.search(r'I\'ll|Let me|Here\'s', code)),  # Claude leaks
            bool(re.search(r'# Note:|# Important:', code)),
        ])

        scores = {
            "ChatGPT": chatgpt_signs,
            "GitHub Copilot": copilot_signs,
            "Claude": claude_signs,
        }

        best = max(scores, key=scores.get)
        if scores[best] >= 2:
            return best
        return "AI (Unknown Source)" if probability >= 50 else "Possibly AI-Assisted"
