"""
PHASE 8 — AUTHORSHIP STYLE PROFILER
styleProfiler.py

Extracts detailed coding style features from a codebase:
- Indentation patterns
- Naming conventions
- Bracket placement
- Average function length

Compares a live coding sample against the repo style profile.
Large deviation = possible AI assistance or different author.
"""

import re
import ast
import math
import statistics
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from collections import Counter


# ─────────────────────────────────────────────────
# DATA MODELS
# ─────────────────────────────────────────────────

@dataclass
class StyleProfile:
    """A comprehensive coding style fingerprint."""
    
    # Indentation
    indentation_type: str = "spaces"           # spaces | tabs
    indentation_size: int = 4                  # 2 | 4 | 8
    
    # Naming conventions
    primary_naming_convention: str = "camelCase"  # camelCase | snake_case | PascalCase
    naming_consistency: float = 1.0            # 0 = inconsistent, 1 = perfectly consistent
    uses_abbreviations: bool = False
    average_identifier_length: float = 7.0
    
    # Bracket & formatting style
    bracket_style: str = "same_line"           # same_line | new_line
    semicolon_usage: str = "always"            # always | never | inconsistent
    max_line_length: int = 80
    average_line_length: float = 45.0
    
    # Function metrics
    average_function_length: float = 15.0     # Lines per function
    average_function_complexity: float = 3.0
    max_function_length: int = 50
    functions_with_docstrings: float = 0.0    # Percentage
    
    # Comment style
    comment_density: float = 0.10             # Comments / total lines
    inline_comments: int = 0
    block_comments: int = 0
    
    # Code patterns
    prefers_early_return: bool = False
    uses_ternary: bool = False
    uses_destructuring: bool = False           # JS/TS specific
    uses_list_comprehension: bool = False      # Python specific
    error_handling_ratio: float = 0.0         # try/except count / function count
    
    # ── Language Specific Signatures (Phase 9) ──
    python_signature: Dict[str, Any] = field(default_factory=lambda: {"uses_decorators": False, "uses_type_hints": False})
    java_signature: Dict[str, Any] = field(default_factory=lambda: {"prefers_interfaces": False, "uses_streams": False})
    cpp_signature: Dict[str, Any] = field(default_factory=lambda: {"uses_templates": False, "uses_smart_pointers": False})
    js_signature: Dict[str, Any] = field(default_factory=lambda: {"uses_promises": False, "uses_arrow_functions": False})

    def to_dict(self) -> Dict[str, Any]:
        return {
            "indentation_type": self.indentation_type,
            "indentation_size": self.indentation_size,
            "primary_naming_convention": self.primary_naming_convention,
            "naming_consistency": round(self.naming_consistency, 3),
            "uses_abbreviations": self.uses_abbreviations,
            "average_identifier_length": round(self.average_identifier_length, 1),
            "bracket_style": self.bracket_style,
            "semicolon_usage": self.semicolon_usage,
            "average_line_length": round(self.average_line_length, 1),
            "average_function_length": round(self.average_function_length, 1),
            "average_function_complexity": round(self.average_function_complexity, 1),
            "functions_with_docstrings": round(self.functions_with_docstrings, 3),
            "comment_density": round(self.comment_density, 3),
            "prefers_early_return": self.prefers_early_return,
            "uses_ternary": self.uses_ternary,
            "uses_list_comprehension": self.uses_list_comprehension,
            "error_handling_ratio": round(self.error_handling_ratio, 3),
            "python_signature": self.python_signature,
            "java_signature": self.java_signature,
            "cpp_signature": self.cpp_signature,
            "js_signature": self.js_signature,
        }


@dataclass
class StyleDeviation:
    """Describes how a live coding sample deviates from repository style."""
    overall_deviation: float = 0.0             # 0.0 = identical, 1.0 = completely different
    authorship_verdict: str = "CONSISTENT"     # CONSISTENT | MINOR_DRIFT | SIGNIFICANT_DRIFT | INCONSISTENT
    deviations: List[Dict[str, Any]] = field(default_factory=list)
    consistency_score: float = 1.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "overall_deviation": round(self.overall_deviation, 3),
            "consistency_score": round(self.consistency_score, 3),
            "authorship_verdict": self.authorship_verdict,
            "deviations": self.deviations,
        }


# ─────────────────────────────────────────────────
# STYLE EXTRACTOR
# ─────────────────────────────────────────────────

class StyleExtractor:
    """Extracts style features from source code."""

    # ── INDENTATION ──

    def detect_indentation(self, content: str) -> Tuple[str, int]:
        """Returns (type, size) e.g. ('spaces', 4) or ('tabs', 1)."""
        lines = content.splitlines()
        tab_lines = 0
        space_sizes = []

        for line in lines:
            if not line or not line[0].isspace():
                continue
            if line.startswith("\t"):
                tab_lines += 1
            else:
                # Count leading spaces
                stripped_len = len(line) - len(line.lstrip())
                if stripped_len > 0:
                    space_sizes.append(stripped_len)

        if tab_lines > len(space_sizes):
            return "tabs", 1

        if not space_sizes:
            return "spaces", 4

        # Find most common indentation unit (GCD approach)
        counter = Counter(space_sizes)
        # Most common indentation size
        most_common = counter.most_common(1)[0][0]
        # Snap to standard sizes
        if most_common <= 2:
            return "spaces", 2
        elif most_common <= 4:
            return "spaces", 4
        else:
            return "spaces", 8

    # ── NAMING CONVENTION ──

    def detect_naming_convention(self, content: str) -> Tuple[str, float, float]:
        """Returns (primary_convention, consistency, avg_identifier_length)."""
        identifiers = re.findall(r"\b[a-zA-Z_][a-zA-Z0-9_]{2,}\b", content)

        if not identifiers:
            return "unknown", 0.5, 5.0

        camel = sum(1 for i in identifiers if re.match(r"[a-z][a-z0-9]*[A-Z][a-zA-Z0-9]*", i))
        pascal = sum(1 for i in identifiers if re.match(r"[A-Z][a-z][a-zA-Z0-9]*", i))
        snake = sum(1 for i in identifiers if "_" in i and i == i.lower())
        upper_snake = sum(1 for i in identifiers if "_" in i and i == i.upper())

        total = max(1, len(identifiers))
        scores = {
            "camelCase": camel / total,
            "PascalCase": pascal / total,
            "snake_case": snake / total,
            "UPPER_SNAKE": upper_snake / total,
        }

        primary = max(scores, key=scores.get)
        consistency = scores[primary]

        avg_len = statistics.mean([len(i) for i in identifiers])
        return primary, consistency, avg_len

    # ── BRACKET STYLE ──

    def detect_bracket_style(self, content: str) -> str:
        """Detect if brackets are on same line or new line."""
        same_line = len(re.findall(r"\)\s*\{", content))
        new_line = len(re.findall(r"\)\s*\n\s*\{", content))

        if same_line + new_line == 0:
            return "same_line"
        return "same_line" if same_line > new_line else "new_line"

    # ── FUNCTION METRICS ──

    def extract_function_metrics_python(self, content: str) -> Dict[str, Any]:
        """Extract function metrics from Python code."""
        try:
            tree = ast.parse(content)
        except SyntaxError:
            return {"avg_length": 15, "avg_complexity": 3, "doc_ratio": 0}

        func_lengths = []
        func_complexities = []
        doc_count = 0
        total_funcs = 0

        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                total_funcs += 1
                length = getattr(node, "end_lineno", 0) - getattr(node, "lineno", 0)
                func_lengths.append(max(1, length))

                complexity = 1 + sum(
                    1 for child in ast.walk(node)
                    if isinstance(child, (ast.If, ast.For, ast.While, ast.Try,
                                         ast.BoolOp, ast.ExceptHandler))
                )
                func_complexities.append(complexity)

                # Check for docstring
                if (node.body and isinstance(node.body[0], ast.Expr)
                        and isinstance(node.body[0].value, ast.Constant)):
                    doc_count += 1

        return {
            "avg_length": statistics.mean(func_lengths) if func_lengths else 15.0,
            "max_length": max(func_lengths) if func_lengths else 50,
            "avg_complexity": statistics.mean(func_complexities) if func_complexities else 3.0,
            "doc_ratio": doc_count / max(1, total_funcs),
            "total_funcs": total_funcs,
        }

    def extract_function_metrics_js(self, content: str) -> Dict[str, Any]:
        """Extract function metrics from JavaScript/TypeScript code."""
        func_regions = []

        # Match function bodies
        for match in re.finditer(
            r"(?:function\s+\w+|=>\s*\{|(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?function)",
            content
        ):
            # Extract potential region
            start = match.start()
            region = content[start:start + 2000]
            lines = region.splitlines()
            # Find matching closing brace
            depth = 0
            func_len = 0
            for i, line in enumerate(lines):
                depth += line.count("{") - line.count("}")
                if depth <= 0 and i > 0:
                    func_len = i
                    break
            if func_len > 0:
                func_regions.append(func_len)

        if not func_regions:
            return {"avg_length": 15.0, "max_length": 50, "avg_complexity": 3.0, "doc_ratio": 0}

        jsdoc_count = len(re.findall(r"/\*\*[\s\S]*?\*/", content))
        return {
            "avg_length": statistics.mean(func_regions),
            "max_length": max(func_regions),
            "avg_complexity": 3.0,   # Hard to compute without proper AST
            "doc_ratio": min(1.0, jsdoc_count / max(1, len(func_regions))),
            "total_funcs": len(func_regions),
        }

    # ── COMMENT METRICS ──

    def extract_comment_metrics(self, content: str) -> Dict[str, Any]:
        lines = content.splitlines()
        total_lines = max(1, len(lines))

        inline = sum(1 for l in lines if re.search(r"(?://|#).+", l) and l.strip()[:2] not in ("//", "# "))
        block_starts = len(re.findall(r"/\*|\"\"\"", content))
        comment_lines = len(re.findall(r"^\s*(?://|#|/\*|\*)", content, re.MULTILINE))

        return {
            "density": comment_lines / total_lines,
            "inline": inline,
            "block": block_starts,
        }

    # ── PATTERN DETECTION ──

    def detect_patterns(self, content: str, ext: str) -> Dict[str, bool]:
        return {
            "early_return": bool(re.search(r"if\s+.*:\s*\n\s+return|if\s*\(.*\)\s+return", content)),
            "ternary": bool(re.search(r"\w+\s*\?\s*\w+\s*:\s*\w+|.+if\s+.+else\s+.+", content)),
            "destructuring": bool(re.search(r"const\s*\{|let\s*\{|\[.*\]\s*=", content)),
            "list_comprehension": bool(re.search(r"\[.+for\s+\w+\s+in\s+.+\]", content)),
            "error_handling": len(re.findall(r"\btry\b", content)),
        }


# ─────────────────────────────────────────────────
# STYLE PROFILER
# ─────────────────────────────────────────────────

class StyleProfiler:
    """
    Phase 8: Authorship Style Profiler.
    
    Builds a comprehensive style fingerprint from a repository
    and can compare it against a live coding sample to detect
    style deviation (a sign of different authorship or AI assistance).
    """

    def __init__(self):
        self.extractor = StyleExtractor()

    def profile_repository(self, files: List[Dict[str, str]]) -> StyleProfile:
        """
        Build a unified style profile from all repository files.
        """
        if not files:
            return StyleProfile()

        indent_types = []
        indent_sizes = []
        naming_conventions = []
        naming_consistencies = []
        identifier_lengths = []
        bracket_styles = []
        func_lengths = []
        func_complexities = []
        doc_ratios = []
        comment_densities = []
        pattern_votes = {
            "early_return": 0, "ternary": 0, "destructuring": 0,
            "list_comprehension": 0, "error_handling_ratio": [],
        }

        for f in files:
            content = f.get("content", "")
            path = f.get("path", "")
            ext = f.get("extension", "").lower()

            if not content or len(content) < 50:
                continue

            # Indentation
            ind_type, ind_size = self.extractor.detect_indentation(content)
            indent_types.append(ind_type)
            indent_sizes.append(ind_size)

            # Naming
            conv, consistency, avg_len = self.extractor.detect_naming_convention(content)
            naming_conventions.append(conv)
            naming_consistencies.append(consistency)
            identifier_lengths.append(avg_len)

            # Bracket style
            bracket_styles.append(self.extractor.detect_bracket_style(content))

            # Function metrics
            if ext == ".py":
                metrics = self.extractor.extract_function_metrics_python(content)
            else:
                metrics = self.extractor.extract_function_metrics_js(content)

            if metrics["avg_length"] > 0:
                func_lengths.append(metrics["avg_length"])
                func_complexities.append(metrics["avg_complexity"])
                doc_ratios.append(metrics["doc_ratio"])

            # Comments
            cm = self.extractor.extract_comment_metrics(content)
            comment_densities.append(cm["density"])

            # Patterns
            patterns = self.extractor.detect_patterns(content, ext)
            for key in ["early_return", "ternary", "destructuring", "list_comprehension"]:
                if patterns.get(key):
                    pattern_votes[key] += 1
            func_count = metrics.get("total_funcs", 1)
            if func_count > 0:
                pattern_votes["error_handling_ratio"].append(
                    patterns.get("error_handling", 0) / func_count
                )

        # Aggregate into profile
        profile = StyleProfile()
        n = len(files)

        profile.indentation_type = Counter(indent_types).most_common(1)[0][0] if indent_types else "spaces"
        profile.indentation_size = Counter(indent_sizes).most_common(1)[0][0] if indent_sizes else 4
        profile.primary_naming_convention = Counter(naming_conventions).most_common(1)[0][0] if naming_conventions else "camelCase"
        profile.naming_consistency = statistics.mean(naming_consistencies) if naming_consistencies else 0.7
        profile.average_identifier_length = statistics.mean(identifier_lengths) if identifier_lengths else 7.0
        profile.bracket_style = Counter(bracket_styles).most_common(1)[0][0] if bracket_styles else "same_line"
        profile.average_function_length = statistics.mean(func_lengths) if func_lengths else 15.0
        profile.average_function_complexity = statistics.mean(func_complexities) if func_complexities else 3.0
        profile.functions_with_docstrings = statistics.mean(doc_ratios) if doc_ratios else 0.0
        profile.comment_density = statistics.mean(comment_densities) if comment_densities else 0.1
        profile.prefers_early_return = pattern_votes["early_return"] > n * 0.3
        profile.uses_ternary = pattern_votes["ternary"] > n * 0.3
        profile.uses_destructuring = pattern_votes["destructuring"] > n * 0.3
        profile.uses_list_comprehension = pattern_votes["list_comprehension"] > n * 0.3
        er_ratios = pattern_votes["error_handling_ratio"]
        profile.error_handling_ratio = statistics.mean(er_ratios) if er_ratios else 0.0

        # Uses abbreviations: average identifier length < 5 = uses terse names
        profile.uses_abbreviations = profile.average_identifier_length < 5.0

        return profile

    def compare_live_code(
        self, live_code: str, repo_profile: StyleProfile, ext: str = ".py"
    ) -> StyleDeviation:
        """
        Compare a live coding sample against the repository style profile.
        Returns a StyleDeviation report.
        """
        # Build live profile
        live_files = [{"content": live_code, "path": f"live_sample{ext}", "extension": ext}]
        live_profile = self.profile_repository(live_files)

        return self._compute_deviation(live_profile, repo_profile)

    def _compute_deviation(
        self, live: StyleProfile, reference: StyleProfile
    ) -> StyleDeviation:
        deviations = []
        total_weight = 0.0
        weighted_deviation = 0.0

        # ── Indentation ──
        weight = 0.20
        if live.indentation_type != reference.indentation_type:
            dev = 1.0
            deviations.append({
                "feature": "indentation_type",
                "repo": reference.indentation_type,
                "live": live.indentation_type,
                "severity": "high",
            })
        elif live.indentation_size != reference.indentation_size:
            dev = 0.5
            deviations.append({
                "feature": "indentation_size",
                "repo": reference.indentation_size,
                "live": live.indentation_size,
                "severity": "medium",
            })
        else:
            dev = 0.0
        weighted_deviation += dev * weight
        total_weight += weight

        # ── Naming ──
        weight = 0.25
        if live.primary_naming_convention != reference.primary_naming_convention:
            dev = 1.0
            deviations.append({
                "feature": "naming_convention",
                "repo": reference.primary_naming_convention,
                "live": live.primary_naming_convention,
                "severity": "high",
            })
        else:
            dev = abs(live.naming_consistency - reference.naming_consistency)
        weighted_deviation += dev * weight
        total_weight += weight

        # ── Function Length ──
        weight = 0.20
        len_diff = abs(live.average_function_length - reference.average_function_length)
        dev = min(1.0, len_diff / max(1, reference.average_function_length))
        if dev > 0.5:
            deviations.append({
                "feature": "avg_function_length",
                "repo": round(reference.average_function_length, 1),
                "live": round(live.average_function_length, 1),
                "severity": "medium",
            })
        weighted_deviation += dev * weight
        total_weight += weight

        # ── Comment Density ──
        weight = 0.15
        comment_diff = abs(live.comment_density - reference.comment_density)
        dev = min(1.0, comment_diff / max(0.01, reference.comment_density + 0.01))
        if dev > 0.5:
            deviations.append({
                "feature": "comment_density",
                "repo": round(reference.comment_density, 3),
                "live": round(live.comment_density, 3),
                "severity": "low",
            })
        weighted_deviation += dev * weight
        total_weight += weight

        # ── Pattern Consistency ──
        weight = 0.20
        pattern_mismatches = 0
        for attr in ["prefers_early_return", "uses_ternary", "uses_list_comprehension"]:
            if getattr(live, attr) != getattr(reference, attr):
                pattern_mismatches += 1
        dev = pattern_mismatches / 3.0
        if dev > 0.33:
            deviations.append({
                "feature": "coding_patterns",
                "note": f"{pattern_mismatches}/3 pattern mismatches",
                "severity": "low",
            })
        weighted_deviation += dev * weight
        total_weight += weight

        overall = weighted_deviation / max(0.001, total_weight)

        result = StyleDeviation(
            overall_deviation=overall,
            consistency_score=1.0 - overall,
            deviations=deviations,
        )

        if overall < 0.2:
            result.authorship_verdict = "CONSISTENT"
        elif overall < 0.40:
            result.authorship_verdict = "MINOR_DRIFT"
        elif overall < 0.65:
            result.authorship_verdict = "SIGNIFICANT_DRIFT"
        else:
            result.authorship_verdict = "INCONSISTENT"

        return result
