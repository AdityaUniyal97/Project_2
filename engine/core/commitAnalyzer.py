"""
PHASE 4 — COMMIT HISTORY FORENSICS
commitAnalyzer.py

Analyzes GitHub commit timeline using git log to detect:
- Large one-time commits (copy-paste events)
- Unnatural commit bursts (bot-like patterns)
- Missing development history
- Suspiciously large early commits
"""

import os
import re
import subprocess
import tempfile
import shutil
import math
import statistics
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field


# ─────────────────────────────────────────────────
# DATA MODELS
# ─────────────────────────────────────────────────

@dataclass
class CommitRecord:
    hash: str
    author: str
    email: str
    timestamp: datetime
    message: str
    lines_added: int
    lines_deleted: int
    files_changed: int
    complexity_score: float = 0.0

    @property
    def total_delta(self) -> int:
        return self.lines_added + self.lines_deleted


@dataclass
class CommitForensicsReport:
    total_commits: int = 0
    unique_authors: int = 0
    first_commit_date: str = ""
    last_commit_date: str = ""
    development_span_days: float = 0.0
    total_lines_added: int = 0
    total_lines_deleted: int = 0
    average_lines_per_commit: float = 0.0
    largest_single_commit_lines: int = 0
    largest_commit_percentage: float = 0.0
    commit_frequency_per_day: float = 0.0
    
    # Phase 2: Temporal Reasoning Intelligence
    learning_curve_trajectory: List[Dict[str, Any]] = field(default_factory=list)
    vertical_complexity_jumps: List[Dict[str, Any]] = field(default_factory=list)
    skill_evolution_score: float = 1.0       # 1.0 = normal learning, 0.0 = suspicious
    
    # Forensics flags
    authenticity_score: float = 1.0          # 0.0 = fake, 1.0 = real
    suspicious_events: List[str] = field(default_factory=list)
    risk_level: str = "LOW"                  # LOW | MEDIUM | HIGH | CRITICAL
    
    # Detailed findings
    burst_events: List[Dict[str, Any]] = field(default_factory=list)
    large_commits: List[Dict[str, Any]] = field(default_factory=list)
    timeline_anomalies: List[str] = field(default_factory=list)
    author_consistency: float = 1.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_commits": self.total_commits,
            "unique_authors": self.unique_authors,
            "first_commit_date": self.first_commit_date,
            "last_commit_date": self.last_commit_date,
            "development_span_days": round(self.development_span_days, 2),
            "total_lines_added": self.total_lines_added,
            "total_lines_deleted": self.total_lines_deleted,
            "average_lines_per_commit": round(self.average_lines_per_commit, 1),
            "largest_single_commit_lines": self.largest_single_commit_lines,
            "largest_commit_percentage": round(self.largest_commit_percentage, 3),
            "commit_frequency_per_day": round(self.commit_frequency_per_day, 2),
            "skill_evolution_score": round(self.skill_evolution_score, 3),
            "vertical_complexity_jumps": self.vertical_complexity_jumps,
            "learning_curve_trajectory": self.learning_curve_trajectory,
            "authenticity_score": round(self.authenticity_score, 3),
            "suspicious_events": self.suspicious_events,
            "risk_level": self.risk_level,
            "burst_events": self.burst_events[:5],
            "large_commits": self.large_commits[:5],
            "timeline_anomalies": self.timeline_anomalies,
            "author_consistency": round(self.author_consistency, 3),
        }


# ─────────────────────────────────────────────────
# COMMIT ANALYZER
# ─────────────────────────────────────────────────

class CommitForensicsAnalyzer:
    """
    Phase 4: Commit History Forensics Engine.
    
    Analyzes git history to detect academic dishonesty patterns:
    - One-shot massive commits (classic sign of copy-paste from external source)
    - Burst commits in unnatural time windows (bot-like behavior)
    - Complete absence of small experimental commits (no real development history)
    - Multi-author projects that suddenly have single-author final commits
    """

    LARGE_COMMIT_THRESHOLD = 300     # Lines in a single commit
    BURST_WINDOW_HOURS = 2           # Time window for burst detection
    BURST_THRESHOLD = 5              # Commits within window = burst
    MIN_HEALTHY_COMMITS = 3          # Less than this = suspicious
    
    def __init__(self, github_token: Optional[str] = None):
        self.github_token = github_token

    def analyze(self, github_url: str) -> CommitForensicsReport:
        """
        Main entry: Clone repo (bare), extract git history, run forensics.
        """
        report = CommitForensicsReport()
        temp_dir = tempfile.mkdtemp(prefix="pg_cfa_")
        
        try:
            if not self._clone_bare(github_url, temp_dir):
                report.suspicious_events.append("Could not access repository history")
                report.authenticity_score = 0.5
                return report

            commits = self._extract_commits(temp_dir)
            
            if not commits:
                report.suspicious_events.append("No commits found in repository")
                report.authenticity_score = 0.3
                report.risk_level = "HIGH"
                return report

            self._populate_base_metrics(commits, report)
            self._compute_commit_complexity(commits)
            self._analyze_skill_evolution(commits, report)
            self._analyze_message_quality(commits, report)
            self._detect_inhuman_intervals(commits, report)
            self._detect_large_commits(commits, report)
            self._detect_burst_commits(commits, report)
            self._detect_missing_history(commits, report)
            self._detect_author_anomalies(commits, report)
            self._compute_authenticity_score(report)

        except Exception as e:
            report.suspicious_events.append(f"Analysis error: {str(e)}")
            report.authenticity_score = 0.5
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

        return report

    # ─────── CLONE ───────

    def _clone_bare(self, github_url: str, target: str) -> bool:
        clone_url = github_url
        if self.github_token and github_url.startswith("https://"):
            clone_url = github_url.replace("https://", f"https://{self.github_token}@")
        
        result = subprocess.run(
            ["git", "clone", "--bare", clone_url, target],
            capture_output=True, text=True, timeout=120
        )
        return result.returncode == 0

    # ─────── LOG EXTRACTION ───────

    def _extract_commits(self, repo_dir: str) -> List[CommitRecord]:
        """Extract full commit log with numstat."""
        sep = "|||"
        
        log_result = subprocess.run(
            [
                "git", "-C", repo_dir, "log",
                f"--format=COMMIT{sep}%H{sep}%an{sep}%ae{sep}%aI{sep}%s",
                "--numstat",
            ],
            capture_output=True, text=True, timeout=60
        )
        
        if log_result.returncode != 0:
            return []

        return self._parse_log(log_result.stdout, sep)

    def _parse_log(self, raw: str, sep: str) -> List[CommitRecord]:
        commits = []
        current: Optional[Dict] = None

        for line in raw.splitlines():
            line = line.strip()
            if not line:
                continue

            if line.startswith(f"COMMIT{sep}"):
                if current:
                    commits.append(self._make_record(current))
                parts = line.split(sep)
                if len(parts) >= 6:
                    ts_str = parts[4].replace("Z", "+00:00")
                    try:
                        ts = datetime.fromisoformat(ts_str)
                    except ValueError:
                        ts = datetime.now(timezone.utc)
                    current = {
                        "hash": parts[1],
                        "author": parts[2],
                        "email": parts[3],
                        "timestamp": ts,
                        "message": parts[5],
                        "added": 0, "deleted": 0, "files": 0,
                    }
                else:
                    current = None
            elif current is not None:
                # numstat line: added\tdeleted\tfilename
                stat = line.split("\t")
                if len(stat) >= 3:
                    try:
                        current["added"] += int(stat[0]) if stat[0] != "-" else 0
                        current["deleted"] += int(stat[1]) if stat[1] != "-" else 0
                        current["files"] += 1
                    except ValueError:
                        pass

        if current:
            commits.append(self._make_record(current))

        return sorted(commits, key=lambda c: c.timestamp)  # Chronological

    def _make_record(self, d: Dict) -> CommitRecord:
        return CommitRecord(
            hash=d["hash"],
            author=d["author"],
            email=d["email"],
            timestamp=d["timestamp"],
            message=d["message"],
            lines_added=d["added"],
            lines_deleted=d["deleted"],
            files_changed=d["files"],
            complexity_score=0.0
        )

    # ─────── BASE METRICS ───────

    def _populate_base_metrics(
        self, commits: List[CommitRecord], report: CommitForensicsReport
    ):
        report.total_commits = len(commits)
        report.unique_authors = len({c.email for c in commits})
        report.first_commit_date = commits[0].timestamp.isoformat()
        report.last_commit_date = commits[-1].timestamp.isoformat()

        delta = commits[-1].timestamp - commits[0].timestamp
        report.development_span_days = max(delta.total_seconds() / 86400, 0.001)

        report.total_lines_added = sum(c.lines_added for c in commits)
        report.total_lines_deleted = sum(c.lines_deleted for c in commits)
        report.average_lines_per_commit = (
            report.total_lines_added / report.total_commits
            if report.total_commits > 0 else 0
        )

        max_added = max(c.lines_added for c in commits) if commits else 0
        report.largest_single_commit_lines = max_added
        report.largest_commit_percentage = (
            max_added / max(1, report.total_lines_added)
        )
        report.commit_frequency_per_day = (
            report.total_commits / report.development_span_days
        )

    # ─────── FORENSIC DETECTORS ───────

    def _compute_commit_complexity(self, commits: List[CommitRecord]):
        for c in commits:
            # Baseline complexity proxy: heavily weighting files changed and line magnitude
            # Realistic commits have a structural balance. 1 file with 10k lines is suspicious (low organic complexity, high copy)
            # Many files with careful additions = high organic complexity
            files_factor = math.log2(max(2, c.files_changed + 1))
            lines_factor = math.sqrt(max(0, c.lines_added + c.lines_deleted))
            message_len = len(c.message.split())
            
            # Simple heuristic score for temporal tracking
            c.complexity_score = (lines_factor * files_factor) + min(10.0, message_len * 0.5)

    def _analyze_skill_evolution(self, commits: List[CommitRecord], report: CommitForensicsReport):
        if not commits: return
        
        trajectory = []
        cumulative_complexity = 0.0
        
        for i, c in enumerate(commits):
            cumulative_complexity += c.complexity_score
            trajectory.append({
                "commit": c.hash[:8],
                "date": c.timestamp.isoformat()[:10],
                "complexity": round(c.complexity_score, 2),
                "cumulative": round(cumulative_complexity, 2)
            })
            
            # Detect sudden vertical jumps
            if i > 0:
                prev_c = commits[i-1]
                # If current complexity is >400% of average previous, and raw added lines is high
                if prev_c.complexity_score > 0:
                    jump_ratio = c.complexity_score / max(1.0, prev_c.complexity_score)
                    if jump_ratio > 4.0 and c.lines_added > 200:
                        report.vertical_complexity_jumps.append({
                            "commit": c.hash[:8],
                            "date": c.timestamp.isoformat()[:10],
                            "jump_ratio": round(jump_ratio, 2),
                            "message": c.message[:50]
                        })
                        report.timeline_anomalies.append(f"Vertical complexity jump detected: {c.hash[:8]} jumped {jump_ratio:.1f}x from previous commit.")
        
        report.learning_curve_trajectory = trajectory
        if report.vertical_complexity_jumps:
            report.skill_evolution_score -= min(0.6, len(report.vertical_complexity_jumps) * 0.2)
        else:
            report.skill_evolution_score = 1.0


    def _detect_large_commits(
        self, commits: List[CommitRecord], report: CommitForensicsReport
    ):
        """Detect suspiciously large single commits."""
        total_added = max(1, report.total_lines_added)

        for c in commits:
            pct = c.lines_added / total_added
            if c.lines_added > self.LARGE_COMMIT_THRESHOLD:
                report.large_commits.append({
                    "hash": c.hash[:10],
                    "date": c.timestamp.isoformat()[:10],
                    "lines_added": c.lines_added,
                    "percentage_of_project": round(pct * 100, 1),
                    "message": c.message[:100],
                })

                if pct > 0.70 and report.total_lines_added > 200:
                    report.suspicious_events.append(
                        f"Single commit ({c.hash[:8]}) adds {pct:.0%} of entire codebase "
                        f"({c.lines_added} lines)"
                    )
                elif pct > 0.50:
                    report.timeline_anomalies.append(
                        f"Large commit: {pct:.0%} of project in one push"
                    )

    def _detect_burst_commits(
        self, commits: List[CommitRecord], report: CommitForensicsReport
    ):
        """Detect unnatural bursts of commits in tight time windows."""
        if len(commits) < 2:
            return

        # Sliding window
        for i, anchor in enumerate(commits):
            window_commits = []
            for j in range(i, len(commits)):
                delta_h = (commits[j].timestamp - anchor.timestamp).total_seconds() / 3600
                if delta_h <= self.BURST_WINDOW_HOURS:
                    window_commits.append(commits[j])
                else:
                    break

            if len(window_commits) >= self.BURST_THRESHOLD:
                burst_lines = sum(c.lines_added for c in window_commits)
                report.burst_events.append({
                    "start": anchor.timestamp.isoformat()[:16],
                    "commits_in_window": len(window_commits),
                    "lines_added": burst_lines,
                    "window_hours": self.BURST_WINDOW_HOURS,
                })

        if report.burst_events:
            largest_burst = max(report.burst_events, key=lambda b: b["commits_in_window"])
            report.suspicious_events.append(
                f"Commit burst detected: {largest_burst['commits_in_window']} commits "
                f"in {self.BURST_WINDOW_HOURS}h window"
            )

    def _detect_missing_history(
        self, commits: List[CommitRecord], report: CommitForensicsReport
    ):
        """Detect missing development history (no iterative development)."""
        if report.total_commits <= 1:
            report.suspicious_events.append(
                "Single commit project: no development history (classic copy-paste signature)"
            )
            return

        if report.total_commits <= self.MIN_HEALTHY_COMMITS:
            report.suspicious_events.append(
                f"Only {report.total_commits} commits: insufficient development trail"
            )

        # Check if development span is too short for codebase size
        if (report.development_span_days < 1.0 and
                report.total_lines_added > 500):
            report.suspicious_events.append(
                f"500+ lines added in under 24 hours (suspicious velocity)"
            )

        # Check for suspiciously even commit sizes (bot pattern)
        if len(commits) >= 5:
            sizes = [c.lines_added for c in commits if c.lines_added > 0]
            if sizes:
                try:
                    cv = statistics.stdev(sizes) / statistics.mean(sizes)
                    if cv < 0.15:  # Very uniform commit sizes
                        report.timeline_anomalies.append(
                            "Suspiciously uniform commit sizes (bot-like pattern)"
                        )
                except statistics.StatisticsError:
                    pass

        # Check for very late large pushes (classic deadline dump)
        if len(commits) >= 3:
            last_commit = commits[-1]
            total_until_last = sum(c.lines_added for c in commits[:-1])
            last_lines = last_commit.lines_added
            if total_until_last > 0 and last_lines / max(1, report.total_lines_added) > 0.6:
                report.timeline_anomalies.append(
                    "Final commit added >60% of project (deadline dump pattern)"
                )

    def _detect_author_anomalies(
        self, commits: List[CommitRecord], report: CommitForensicsReport
    ):
        """Detect suspicious author patterns."""
        if not commits:
            return

        author_counts = {}
        for c in commits:
            key = c.email or c.author
            author_counts[key] = author_counts.get(key, 0) + 1

        total = len(commits)
        dominant_pct = max(author_counts.values()) / total if author_counts else 1.0
        report.author_consistency = dominant_pct

        # Multiple authors then sudden single-author is fine
        # BUT: multiple different emails for same name = suspicious
        names = [c.author for c in commits]
        emails = [c.email for c in commits]
        unique_names = len(set(names))
        unique_emails = len(set(emails))

        if unique_emails > unique_names * 2:
            report.timeline_anomalies.append(
                "Multiple email addresses for same apparent author (identity inconsistency)"
            )

    # ─────── SCORING ───────

    def _detect_inhuman_intervals(self, commits: List[CommitRecord], report: CommitForensicsReport):
        """Detect commits at inhuman intervals (e.g., every 30s)."""
        if len(commits) < 10: return
        
        intervals = []
        for i in range(1, len(commits)):
            diff = (commits[i].timestamp - commits[i-1].timestamp).total_seconds()
            intervals.append(diff)
            
        short_intervals = [i for i in intervals if i < 45] # Under 45 seconds
        if len(short_intervals) > len(intervals) * 0.3:
            report.suspicious_events.append(f"Inhuman commit velocity: {len(short_intervals)} commits created in under 45s intervals.")
            report.timeline_anomalies.append("Robotic/AI-paced commit pattern detected.")

    def _analyze_message_quality(self, commits: List[CommitRecord], report: CommitForensicsReport):
        """Analyze if commit messages are generic/garbage or descriptive of learning."""
        generic_patterns = [r"^update", r"^fix", r"^changes", r"^commit", r"^\.", r"^add", r"^test"]
        generic_count = 0
        for c in commits:
            msg = c.message.lower().strip()
            if any(re.match(p, msg) for p in generic_patterns) and len(msg.split()) < 3:
                generic_count += 1
        
        quality_ratio = 1.0 - (generic_count / len(commits))
        if quality_ratio < 0.3 and len(commits) > 5:
            report.suspicious_events.append("Low quality/Generic commit messages (missing development context).")
        return quality_ratio

    def _compute_authenticity_score(self, report: CommitForensicsReport):
        """
        Calculates final 0-100 score based on 4 pillars:
        - Frequency Naturalness (30%)
        - Message Quality (20%)
        - Complexity Progression (30%)
        - Refactoring/Correction Patterns (20%)
        """
        # Frequency (No inhuman intervals, reasonable span)
        freq_score = 100.0
        if any("Inhuman" in e for e in report.suspicious_events): freq_score -= 60
        if report.development_span_days < 0.5: freq_score -= 30
        
        # Message Quality
        # (Internal calculation - approximated for this version)
        msg_score = 100.0
        if any("Low quality" in e for e in report.suspicious_events): msg_score -= 50

        # Complexity Progression (Skill Evolution)
        comp_score = report.skill_evolution_score * 100.0
        
        # Refactoring (presence of deletions/fixes indicating human iteration)
        refactor_score = 0.0
        if report.total_lines_deleted > report.total_lines_added * 0.05:
            refactor_score = 100.0  # Shows healthy deletion/refactoring
        else:
            refactor_score = 40.0   # suspicious 'add-only' behavior
            
        final = (freq_score * 0.3) + (msg_score * 0.2) + (comp_score * 0.3) + (refactor_score * 0.2)
        report.authenticity_score = max(0.0, min(100.0, final)) / 100.0

        if report.authenticity_score < 0.4:
            report.risk_level = "CRITICAL"
        elif report.authenticity_score < 0.65:
            report.risk_level = "HIGH"
        elif report.authenticity_score < 0.85:
            report.risk_level = "MEDIUM"
        else:
            report.risk_level = "LOW"
