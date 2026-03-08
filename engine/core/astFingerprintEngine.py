"""
PHASE 2 — AST STRUCTURAL FINGERPRINTING ENGINE
astFingerprintEngine.py

Generates structural fingerprints of code using language-specific AST parsers.
Detects suspicious structural similarity patterns across repositories.
"""

import ast
import re
import math
import hashlib
from typing import Dict, Any, List, Tuple, Optional
from dataclasses import dataclass, field


# ─────────────────────────────────────────────────
# DATA MODELS
# ─────────────────────────────────────────────────

@dataclass
class FunctionFingerprint:
    name: str
    file: str
    structural_hash: str          # Hash of the anonymized AST
    call_graph: List[str] = field(default_factory=list)        # Functions this function calls
    uses_recursion: bool = False
    control_flow: List[str] = field(default_factory=list)      # List of control structures
    variable_usage_style: str = "mixed"                        # descriptive | terse | mixed
    parameter_count: int = 0
    return_count: int = 0
    nesting_depth: int = 0
    line_count: int = 0


@dataclass
class FileFingerprint:
    path: str
    language: str
    functions: List[FunctionFingerprint] = field(default_factory=list)
    class_count: int = 0
    import_fingerprint: str = ""                               # Hash of sorted imports
    control_flow_density: float = 0.0


@dataclass
class SimilarityMatch:
    file_a: str
    file_b: str
    function_a: str
    function_b: str
    similarity_score: float
    is_suspicious: bool
    reason: str


@dataclass
class FingerprintReport:
    fingerprints: List[FileFingerprint] = field(default_factory=list)
    similarity_matches: List[SimilarityMatch] = field(default_factory=list)
    overall_similarity: float = 0.0
    suspicious_count: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_files_analyzed": len(self.fingerprints),
            "total_functions": sum(len(fp.functions) for fp in self.fingerprints),
            "overall_similarity": round(self.overall_similarity, 3),
            "suspicious_count": self.suspicious_count,
            "similarity_matches": [
                {
                    "file_a": m.file_a,
                    "file_b": m.file_b,
                    "function_a": m.function_a,
                    "function_b": m.function_b,
                    "similarity_score": round(m.similarity_score, 3),
                    "is_suspicious": m.is_suspicious,
                    "reason": m.reason,
                }
                for m in self.similarity_matches[:20]
            ],
        }


# ─────────────────────────────────────────────────
# PYTHON AST FINGERPRINTER
# ─────────────────────────────────────────────────

class PythonASTFingerprinter:
    """
    Generates structural fingerprints from Python source code
    using the stdlib `ast` module.
    """

    def fingerprint_file(self, content: str, path: str) -> Optional[FileFingerprint]:
        try:
            tree = ast.parse(content, filename=path)
        except SyntaxError:
            return None

        fp = FileFingerprint(path=path, language="python")
        fp.class_count = sum(1 for n in ast.walk(tree) if isinstance(n, ast.ClassDef))

        imports = sorted([
            (n.names[0].name if isinstance(n, ast.Import) else n.module or "")
            for n in ast.walk(tree) if isinstance(n, (ast.Import, ast.ImportFrom))
        ])
        fp.import_fingerprint = hashlib.sha256("|".join(imports).encode()).hexdigest()[:16]

        control_nodes = [
            n for n in ast.walk(tree)
            if isinstance(n, (ast.If, ast.For, ast.While, ast.Try, ast.With))
        ]
        all_nodes = list(ast.walk(tree))
        fp.control_flow_density = len(control_nodes) / max(1, len(all_nodes))

        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                func_fp = self._fingerprint_function(node, path)
                fp.functions.append(func_fp)

        return fp

    def _fingerprint_function(self, node: ast.FunctionDef, file_path: str) -> FunctionFingerprint:
        # Structural hash (anonymized)
        anonymized = self._anonymize(node)
        structural_hash = hashlib.sha256(ast.dump(anonymized).encode()).hexdigest()[:20]

        # Call graph
        calls = []
        for child in ast.walk(node):
            if isinstance(child, ast.Call):
                if isinstance(child.func, ast.Name):
                    calls.append(child.func.id)
                elif isinstance(child.func, ast.Attribute):
                    calls.append(child.func.attr)

        # Recursion detection
        uses_recursion = node.name in calls

        # Control flow structures
        control = []
        for child in ast.walk(node):
            if isinstance(child, ast.If): control.append("if")
            elif isinstance(child, ast.For): control.append("for")
            elif isinstance(child, ast.While): control.append("while")
            elif isinstance(child, ast.Try): control.append("try")
            elif isinstance(child, ast.With): control.append("with")

        # Return count
        returns = sum(1 for n in ast.walk(node) if isinstance(n, ast.Return))

        # Nesting depth
        depth = self._max_nesting_depth(node)

        # Variable usage style
        variable_names = [
            n.id for n in ast.walk(node)
            if isinstance(n, ast.Name)
        ]
        style = self._infer_naming_style(variable_names)

        # Line count
        line_count = getattr(node, "end_lineno", 0) - getattr(node, "lineno", 0)

        return FunctionFingerprint(
            name=node.name,
            file=file_path,
            structural_hash=structural_hash,
            call_graph=list(dict.fromkeys(calls))[:15],
            uses_recursion=uses_recursion,
            control_flow=control,
            variable_usage_style=style,
            parameter_count=len(node.args.args),
            return_count=returns,
            nesting_depth=depth,
            line_count=line_count,
        )

    def _anonymize(self, node: ast.AST) -> ast.AST:
        """Strip all variable names, keeping only structural tokens."""
        class Anonymizer(ast.NodeTransformer):
            def visit_Name(self, n):
                return ast.Name(id="V", ctx=n.ctx)
            def visit_arg(self, n):
                return ast.arg(arg="A", annotation=None)
            def visit_Constant(self, n):
                return ast.Constant(value=0)
        return Anonymizer().visit(node)

    def _max_nesting_depth(self, node: ast.AST) -> int:
        """Calculate maximum nesting depth of control structures."""
        max_depth = [0]
        def walk(n, depth):
            if isinstance(n, (ast.If, ast.For, ast.While, ast.With, ast.Try)):
                depth += 1
                max_depth[0] = max(max_depth[0], depth)
            for child in ast.iter_child_nodes(n):
                walk(child, depth)
        walk(node, 0)
        return max_depth[0]

    def _infer_naming_style(self, names: List[str]) -> str:
        if not names:
            return "unknown"
        descriptive = sum(1 for n in names if len(n) > 4)
        terse = sum(1 for n in names if len(n) <= 2)
        total = len(names)
        if descriptive / total > 0.6:
            return "descriptive"
        elif terse / total > 0.3:
            return "terse"
        return "mixed"


# ─────────────────────────────────────────────────
# JS/TS REGEX FINGERPRINTER (tree-sitter fallback)
# ─────────────────────────────────────────────────

class JSFingerprinter:
    """
    Generates structural fingerprints from JavaScript/TypeScript
    using regex-based structural analysis (tree-sitter fallback).
    """

    def fingerprint_file(self, content: str, path: str) -> Optional[FileFingerprint]:
        fp = FileFingerprint(path=path, language="javascript")

        # Count classes
        fp.class_count = len(re.findall(r"\bclass\s+\w+", content))

        # Import fingerprint
        imports = sorted(re.findall(r"from\s+['\"]([^'\"]+)['\"]", content))
        fp.import_fingerprint = hashlib.sha256("|".join(imports).encode()).hexdigest()[:16]

        # Control flow density
        control_count = sum(len(re.findall(p, content)) for p in [
            r"\bif\b", r"\bfor\b", r"\bwhile\b", r"\bswitch\b", r"\btry\b"
        ])
        line_count = max(1, len(content.splitlines()))
        fp.control_flow_density = control_count / line_count

        # Extract functions
        for match in re.finditer(
            r"(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\()",
            content
        ):
            name = match.group(1) or match.group(2)
            if not name:
                continue

            func_fp = self._fingerprint_function_region(name, content, match.start(), path)
            fp.functions.append(func_fp)

        return fp

    def _fingerprint_function_region(
        self, name: str, content: str, start: int, file_path: str
    ) -> FunctionFingerprint:
        # Extract an approximate region of 50 lines from start
        region = content[start:start + 2000]
        lines = region.splitlines()[:50]
        region_text = "\n".join(lines)

        # Structural hash of anonymized control tokens
        anonymized = re.sub(r"\b\w+\b", "V", region_text)
        structural_hash = hashlib.sha256(anonymized.encode()).hexdigest()[:20]

        # Call graph: any word followed by '('
        calls = re.findall(r"\b(\w+)\s*\(", region_text)
        calls = [c for c in calls if c not in {"if", "for", "while", "return", "switch"}]

        uses_recursion = name in calls

        control = []
        for kw in ["if", "for", "while", "switch", "try", "catch"]:
            if re.search(rf"\b{kw}\b", region_text):
                control.append(kw)

        params = re.search(r"\((.*?)\)", region_text)
        param_count = len(params.group(1).split(",")) if params and params.group(1).strip() else 0

        return FunctionFingerprint(
            name=name,
            file=file_path,
            structural_hash=structural_hash,
            call_graph=list(dict.fromkeys(calls))[:15],
            uses_recursion=uses_recursion,
            control_flow=control,
            parameter_count=param_count,
            return_count=len(re.findall(r"\breturn\b", region_text)),
            nesting_depth=0,
            line_count=len(lines),
        )


# ─────────────────────────────────────────────────
# SIMILARITY COMPUTATION
# ─────────────────────────────────────────────────

class StructuralSimilarityComputer:
    """Compare fingerprints between repositories or files."""

    SUSPICIOUS_THRESHOLD = 0.85

    def compare_fingerprints(
        self,
        fps_a: List[FileFingerprint],
        fps_b: List[FileFingerprint],
    ) -> FingerprintReport:
        report = FingerprintReport()
        report.fingerprints = fps_a + fps_b

        # Build function hash maps
        map_a = {f"{fp.path}::{fn.name}": fn for fp in fps_a for fn in fp.functions}
        map_b = {f"{fp.path}::{fn.name}": fn for fp in fps_b for fn in fp.functions}

        similarities = []

        for key_a, fn_a in map_a.items():
            for key_b, fn_b in map_b.items():
                score = self._compute_function_similarity(fn_a, fn_b)
                if score > 0.5:  # Only record meaningful similarity
                    is_suspicious = score >= self.SUSPICIOUS_THRESHOLD
                    reason = self._build_reason(fn_a, fn_b, score)
                    match = SimilarityMatch(
                        file_a=fn_a.file,
                        file_b=fn_b.file,
                        function_a=fn_a.name,
                        function_b=fn_b.name,
                        similarity_score=score,
                        is_suspicious=is_suspicious,
                        reason=reason,
                    )
                    report.similarity_matches.append(match)
                    similarities.append(score)

        # Sort by score (highest first)
        report.similarity_matches.sort(key=lambda m: m.similarity_score, reverse=True)
        report.suspicious_count = sum(1 for m in report.similarity_matches if m.is_suspicious)
        report.overall_similarity = (
            sum(similarities) / len(similarities) if similarities else 0.0
        )

        return report

    def _compute_function_similarity(
        self, a: FunctionFingerprint, b: FunctionFingerprint
    ) -> float:
        """Compute structural similarity between two function fingerprints."""
        score = 0.0
        weight_total = 0.0

        # 1. Structural hash (most important)
        if a.structural_hash == b.structural_hash:
            score += 0.50
        weight_total += 0.50

        # 2. Control flow pattern similarity
        cf_set_a = set(a.control_flow)
        cf_set_b = set(b.control_flow)
        if cf_set_a or cf_set_b:
            intersection = cf_set_a & cf_set_b
            union = cf_set_a | cf_set_b
            cf_sim = len(intersection) / len(union) if union else 1.0
            score += cf_sim * 0.20
        weight_total += 0.20

        # 3. Call graph overlap
        calls_a = set(a.call_graph)
        calls_b = set(b.call_graph)
        if calls_a or calls_b:
            overlap = len(calls_a & calls_b) / max(1, len(calls_a | calls_b))
            score += overlap * 0.15
        weight_total += 0.15

        # 4. Structural metrics similarity
        metrics_sim = 1.0 - min(1.0, (
            abs(a.parameter_count - b.parameter_count) / max(1, max(a.parameter_count, b.parameter_count)) * 0.5 +
            abs(a.return_count - b.return_count) / max(1, max(a.return_count, b.return_count) + 1) * 0.3 +
            abs(a.nesting_depth - b.nesting_depth) / max(1, max(a.nesting_depth, b.nesting_depth) + 1) * 0.2
        ))
        score += metrics_sim * 0.10
        weight_total += 0.10

        # 5. Recursion match
        if a.uses_recursion == b.uses_recursion:
            score += 0.05
        weight_total += 0.05

        return score / weight_total if weight_total > 0 else 0.0

    def _build_reason(self, a: FunctionFingerprint, b: FunctionFingerprint, score: float) -> str:
        parts = []
        if a.structural_hash == b.structural_hash:
            parts.append("identical structural AST hash")
        if set(a.control_flow) == set(b.control_flow):
            parts.append("identical control flow patterns")
        if set(a.call_graph) & set(b.call_graph):
            common = set(a.call_graph) & set(b.call_graph)
            parts.append(f"shared function calls: {', '.join(list(common)[:3])}")
        return "; ".join(parts) if parts else f"high structural similarity ({score:.0%})"


# ─────────────────────────────────────────────────
# MAIN ENGINE
# ─────────────────────────────────────────────────

class ASTFingerprintEngine:
    """
    Phase 2: AST Structural Fingerprinting Engine.
    Orchestrates fingerprinting across languages and computes similarity.
    """

    def __init__(self):
        self.py_fingerprinter = PythonASTFingerprinter()
        self.js_fingerprinter = JSFingerprinter()
        self.similarity_computer = StructuralSimilarityComputer()

    def fingerprint_files(self, files: List[Dict[str, str]]) -> List[FileFingerprint]:
        """
        Fingerprint a list of files.
        `files` is a list of {"path": str, "content": str, "extension": str}
        """
        fingerprints = []
        for f in files:
            ext = f.get("extension", "").lower()
            content = f.get("content", "")
            path = f.get("path", "")

            fp = None
            if ext == ".py":
                fp = self.py_fingerprinter.fingerprint_file(content, path)
            elif ext in (".ts", ".js", ".tsx", ".jsx"):
                fp = self.js_fingerprinter.fingerprint_file(content, path)

            if fp:
                fingerprints.append(fp)

        return fingerprints

    def compute_similarity_report(
        self,
        fps_project_a: List[FileFingerprint],
        fps_project_b: List[FileFingerprint],
    ) -> FingerprintReport:
        return self.similarity_computer.compare_fingerprints(fps_project_a, fps_project_b)

    def fingerprint_single_project(self, files: List[Dict[str, str]]) -> FingerprintReport:
        """Fingerprint a single project (intra-project similarity)."""
        fps = self.fingerprint_files(files)
        # Compare all pairs within the same project for internal duplication
        return self.compute_similarity_report(fps, fps)
