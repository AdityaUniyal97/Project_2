"""
PHASE 6 — CONTEXTUAL ANSWER EVALUATION
answerEvaluator.py

Evaluates student viva responses by:
1. Embedding student answer (keyword + TF-IDF based)
2. Retrieving relevant code snippets from repository context
3. Computing semantic similarity between answer and actual code
"""

import re
import math
import string
from typing import Dict, Any, List, Tuple, Optional
from dataclasses import dataclass, field
from collections import Counter


# ─────────────────────────────────────────────────
# LIGHTWEIGHT EMBEDDINGS (No external dependencies)
# ─────────────────────────────────────────────────

class TFIDFEmbedder:
    """
    Lightweight TF-IDF based embedding for semantic comparison.
    Uses term frequency and inverse document frequency to create
    semantic vectors for code and natural language.
    """

    STOP_WORDS = {
        "the", "a", "an", "is", "it", "in", "of", "to", "and", "or", "for",
        "with", "that", "this", "was", "are", "be", "been", "have", "has",
        "at", "by", "from", "on", "not", "do", "its", "my", "we", "i",
        "you", "he", "she", "they", "as", "but", "can", "will", "so",
        "if", "then", "else", "also", "just", "up", "out", "use", "get",
    }

    CODE_STOP_WORDS = {
        "const", "let", "var", "def", "class", "function", "return",
        "import", "from", "export", "default", "async", "await",
        "true", "false", "null", "undefined", "none", "self",
        "this", "new", "try", "catch", "throw", "if", "else",
        "for", "while", "break", "continue", "pass",
    }

    def tokenize_text(self, text: str, is_code: bool = False) -> List[str]:
        """Tokenize natural language or code into meaningful terms."""
        # Split camelCase: parseUserInput → parse User Input
        text = re.sub(r"([a-z])([A-Z])", r"\1 \2", text)
        # Split snake_case: parse_user_input → parse user input
        text = text.replace("_", " ")
        # Remove punctuation except for meaningful operators
        text = re.sub(r"[^\w\s]", " ", text)
        # Lowercase and split
        tokens = text.lower().split()

        stop = self.STOP_WORDS | (self.CODE_STOP_WORDS if is_code else set())
        return [t for t in tokens if t not in stop and len(t) > 2]

    def compute_tfidf(self, documents: List[List[str]]) -> List[Dict[str, float]]:
        """Compute TF-IDF vectors for a list of token lists."""
        n = len(documents)
        if n == 0:
            return []

        # Document frequency for IDF
        df = Counter()
        for doc in documents:
            for term in set(doc):
                df[term] += 1

        # TF-IDF for each document
        vectors = []
        for doc in documents:
            if not doc:
                vectors.append({})
                continue
            tf = Counter(doc)
            total = len(doc)
            vector = {}
            for term, count in tf.items():
                tf_val = count / total
                idf_val = math.log((1 + n) / (1 + df[term])) + 1
                vector[term] = tf_val * idf_val
            vectors.append(vector)

        return vectors

    def cosine_similarity(self, vec_a: Dict[str, float], vec_b: Dict[str, float]) -> float:
        """Compute cosine similarity between two TF-IDF vectors."""
        all_terms = set(vec_a.keys()) | set(vec_b.keys())
        if not all_terms:
            return 0.0

        dot = sum(vec_a.get(t, 0) * vec_b.get(t, 0) for t in all_terms)
        mag_a = math.sqrt(sum(v ** 2 for v in vec_a.values()))
        mag_b = math.sqrt(sum(v ** 2 for v in vec_b.values()))

        if mag_a == 0 or mag_b == 0:
            return 0.0

        return dot / (mag_a * mag_b)

    def embed(self, text: str, is_code: bool = False) -> Dict[str, float]:
        """Embed a single piece of text."""
        tokens = self.tokenize_text(text, is_code)
        vectors = self.compute_tfidf([tokens])
        return vectors[0] if vectors else {}


# ─────────────────────────────────────────────────
# CONTEXT RETRIEVER
# ─────────────────────────────────────────────────

class ContextRetriever:
    """
    Retrieves relevant code snippets from repository files
    that are most semantically relevant to a given query.
    """

    def __init__(self, embedder: TFIDFEmbedder):
        self.embedder = embedder

    def retrieve_relevant_snippets(
        self,
        query: str,
        repo_files: List[Dict[str, str]],
        top_k: int = 5,
    ) -> List[Tuple[str, str, float]]:
        """
        Retrieve top-k most relevant code snippets.
        Returns: list of (file_path, snippet, relevance_score)
        """
        if not repo_files:
            return []

        query_vec = self.embedder.embed(query, is_code=False)
        results = []

        for f in repo_files:
            path = f.get("path", "")
            content = f.get("content", "")
            if not content:
                continue

            # Split content into chunks (functions or blocks)
            chunks = self._chunk_code(content, path)
            
            for chunk in chunks:
                code_vec = self.embedder.embed(chunk, is_code=True)
                score = self.embedder.cosine_similarity(query_vec, code_vec)
                if score > 0.05:  # Only meaningful matches
                    results.append((path, chunk[:300], score))

        results.sort(key=lambda x: x[2], reverse=True)
        return results[:top_k]

    def _chunk_code(self, content: str, path: str) -> List[str]:
        """Split code into function-level chunks for retrieval."""
        # Python: split by def
        if path.endswith(".py"):
            chunks = re.split(r"\n(?=def |async def |class )", content)
        # JS/TS: split by function
        elif path.endswith((".js", ".ts", ".tsx", ".jsx")):
            chunks = re.split(r"\n(?=function |const \w+ = |class |\w+\()", content)
        else:
            # Generic: split by blank lines
            chunks = [c.strip() for c in re.split(r"\n{2,}", content)]

        # Filter empty and tiny chunks
        return [c for c in chunks if len(c) > 50][:20]


# ─────────────────────────────────────────────────
# DATA MODELS
# ─────────────────────────────────────────────────

@dataclass
class AnswerEvaluationResult:
    context_match_score: float = 0.0        # 0.0 – 1.0
    technical_accuracy: float = 0.0         # 0.0 – 1.0
    code_alignment: float = 0.0             # 0.0 – 1.0
    authorship_verdict: str = "UNKNOWN"     # STRONG | MODERATE | WEAK | SUSPICIOUS
    explanation: str = ""
    matched_snippets: List[Dict[str, Any]] = field(default_factory=list)
    detected_knowledge_gaps: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "context_match_score": round(self.context_match_score * 100, 1),
            "technical_accuracy": round(self.technical_accuracy * 100, 1),
            "code_alignment": round(self.code_alignment * 100, 1),
            "authorship_verdict": self.authorship_verdict,
            "explanation": self.explanation,
            "matched_snippets": self.matched_snippets,
            "detected_knowledge_gaps": self.detected_knowledge_gaps,
        }


# ─────────────────────────────────────────────────
# ANSWER EVALUATOR
# ─────────────────────────────────────────────────

class AnswerEvaluator:
    """
    Phase 6: Contextual Answer Evaluation.
    
    Evaluates a student's viva response by:
    1. Embedding the answer
    2. Retrieving relevant code snippets
    3. Computing semantic alignment between answer and code
    4. Detecting knowledge gaps
    """

    # Keywords that indicate genuine code understanding
    TECHNICAL_DEPTH_MARKERS = {
        "complexity_awareness": [
            "o(n", "big o", "time complexity", "space complexity", "performance",
            "optimization", "efficient", "slower", "faster",
        ],
        "error_handling": [
            "exception", "error", "null check", "undefined", "edge case",
            "validation", "sanitize", "fail", "crash",
        ],
        "design_awareness": [
            "pattern", "abstraction", "coupling", "cohesion", "interface",
            "dependency", "refactor", "single responsibility", "dry",
        ],
        "testing_awareness": [
            "unit test", "integration test", "mock", "stub", "test case",
            "assert", "coverage", "regression",
        ],
        "architecture_awareness": [
            "middleware", "layer", "route", "controller", "model",
            "service", "repository", "api", "endpoint", "schema",
        ],
    }

    RED_FLAGS = [
        ("i don't remember", 0.3, "Cannot recall own implementation"),
        ("i think it", 0.2, "Uncertainty about own code"),
        ("the code does", 0.1, "Passive distancing from code"),
        ("it was generated", 0.8, "Explicit AI admission"),
        ("chatgpt", 0.9, "Direct AI mention"),
        ("ai tool", 0.7, "AI tool acknowledgment"),
    ]

    def __init__(self):
        self.embedder = TFIDFEmbedder()
        self.retriever = ContextRetriever(self.embedder)

    def evaluate(
        self,
        question: str,
        student_answer: str,
        repo_files: List[Dict[str, str]],
        target_file: str = "",
        target_function: str = "",
    ) -> AnswerEvaluationResult:
        """
        Evaluate a student's answer against the repository context.
        """
        result = AnswerEvaluationResult()

        if not student_answer or len(student_answer) < 20:
            result.authorship_verdict = "SUSPICIOUS"
            result.explanation = "Answer too short to evaluate. Student appears unable to explain their code."
            result.detected_knowledge_gaps.append("No substantive answer provided")
            return result

        # 1. Retrieve relevant code snippets
        query = f"{question} {student_answer}"
        relevant_snippets = self.retriever.retrieve_relevant_snippets(
            query, repo_files, top_k=5
        )

        # 2. Compute code alignment
        answer_vec = self.embedder.embed(student_answer, is_code=False)
        snippet_scores = []

        for path, snippet, relevance in relevant_snippets:
            code_vec = self.embedder.embed(snippet, is_code=True)
            alignment = self.embedder.cosine_similarity(answer_vec, code_vec)
            snippet_scores.append(alignment)
            result.matched_snippets.append({
                "file": path,
                "snippet": snippet[:200] + ("..." if len(snippet) > 200 else ""),
                "relevance": round(relevance, 3),
                "alignment_with_answer": round(alignment, 3),
            })

        if snippet_scores:
            result.code_alignment = max(snippet_scores)  # Best match

        # 3. Technical depth analysis
        answer_lower = student_answer.lower()
        depth_scores = []

        for category, markers in self.TECHNICAL_DEPTH_MARKERS.items():
            hit_count = sum(1 for m in markers if m in answer_lower)
            category_score = min(1.0, hit_count / max(1, len(markers) * 0.3))
            depth_scores.append(category_score)
            if category_score == 0:
                result.detected_knowledge_gaps.append(
                    f"No evidence of {category.replace('_', ' ')}"
                )

        result.technical_accuracy = (
            sum(depth_scores) / len(depth_scores) if depth_scores else 0.0
        )

        # 4. Red flag detection
        red_flag_weight = 0.0
        for phrase, penalty, reason in self.RED_FLAGS:
            if phrase in answer_lower:
                red_flag_weight += penalty
                result.detected_knowledge_gaps.append(f"Red flag: {reason}")

        # 5. Composite context match score
        answer_quality_bonus = min(0.3, len(student_answer) / 1000)  # Length bonus up to 30%
        result.context_match_score = max(0.0, min(1.0,
            result.code_alignment * 0.40
            + result.technical_accuracy * 0.40
            + answer_quality_bonus
            - red_flag_weight * 0.5
        ))

        # 6. Determine authorship verdict
        score = result.context_match_score
        if red_flag_weight > 0.7:
            result.authorship_verdict = "SUSPICIOUS"
            result.explanation = "Student answer contains strong indicators of lack of authorship."
        elif score >= 0.65:
            result.authorship_verdict = "STRONG"
            result.explanation = "Answer demonstrates genuine familiarity with the codebase."
        elif score >= 0.40:
            result.authorship_verdict = "MODERATE"
            result.explanation = "Answer shows partial understanding. Follow-up questions recommended."
        elif score >= 0.20:
            result.authorship_verdict = "WEAK"
            result.explanation = "Answer lacks technical depth expected from the code author."
        else:
            result.authorship_verdict = "SUSPICIOUS"
            result.explanation = "Answer does not align with repository content. Low authorship probability."

        return result

    def batch_evaluate(
        self,
        qa_pairs: List[Dict[str, str]],
        repo_files: List[Dict[str, str]],
    ) -> Dict[str, Any]:
        """
        Evaluate multiple question-answer pairs and aggregate.
        `qa_pairs`: list of {"question": str, "answer": str, "target_file": str}
        """
        evaluations = []
        for qa in qa_pairs:
            evaluation = self.evaluate(
                question=qa.get("question", ""),
                student_answer=qa.get("answer", ""),
                repo_files=repo_files,
                target_file=qa.get("target_file", ""),
                target_function=qa.get("target_function", ""),
            )
            evaluations.append(evaluation.to_dict())

        if not evaluations:
            return {"overall_score": 0.0, "verdict": "UNKNOWN", "evaluations": []}

        scores = [e["context_match_score"] for e in evaluations]
        overall = sum(scores) / len(scores) if scores else 0.0

        verdicts = [e["authorship_verdict"] for e in evaluations]
        suspicious_count = verdicts.count("SUSPICIOUS") + verdicts.count("WEAK")
        
        if suspicious_count >= len(verdicts) * 0.6:
            overall_verdict = "SUSPICIOUS"
        elif suspicious_count >= len(verdicts) * 0.3:
            overall_verdict = "MODERATE"
        else:
            overall_verdict = "STRONG"

        return {
            "overall_score": round(overall, 1),
            "verdict": overall_verdict,
            "evaluations": evaluations,
        }
