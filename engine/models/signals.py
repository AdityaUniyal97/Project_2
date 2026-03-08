import os
import shutil
import tempfile
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field

@dataclass
class ParsedFunction:
    name: str
    body: str
    hash: str
    size: int

@dataclass
class ParsedFile:
    path: str
    content: str
    hash: str
    size: int
    functions: List[ParsedFunction] = field(default_factory=list)

@dataclass
class ProjectMap:
    """Structured representation of a student project passed between agents."""
    project_id: str
    project_name: str
    github_url: str
    total_files: int = 0
    files: List[ParsedFile] = field(default_factory=list)
    project_signature: str = ""
    error: Optional[str] = None
    repo_context: Dict[str, Any] = field(default_factory=dict)
    language_distribution: Dict[str, Any] = field(default_factory=dict)

@dataclass
class SimilaritySignal:
    """Standardized output from the HashSimilarityAgent."""
    exact_match: bool = False
    project_similarity_score: float = 0.0
    file_overlap_percentage: float = 0.0
    function_overlap_percentage: float = 0.0
    matched_project_ids: List[str] = field(default_factory=list)
    similarity_matrix: Dict[str, Any] = field(default_factory=dict)

@dataclass
class CommitSignal:
    """Standardized behavioral output from the CommitAgent."""
    total_commits: int = 0
    first_commit_date: str = ""
    last_commit_date: str = ""
    development_span_days: float = 0.0
    total_lines_added: int = 0
    total_lines_deleted: int = 0
    average_lines_per_commit: float = 0.0
    largest_single_commit_lines: int = 0
    commit_frequency_per_day: float = 0.0
    
    # Intelligence Flags
    commit_risk_score: float = 0.0
    skill_evolution_score: float = 1.0
    suspicious_commit_flag: bool = False
    suspicion_reasons: List[str] = field(default_factory=list)
