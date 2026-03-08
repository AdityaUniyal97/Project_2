import os
import subprocess
import tempfile
import shutil
from datetime import datetime
from typing import Dict, Any, List

from engine.agents.base_agent import BaseAgent
from engine.models.signals import CommitSignal

class CommitAgent(BaseAgent):
    """
    Agent 4: Behavioral Intelligence (The Commits Agent)
    Delegates to CommitForensicsAnalyzer for deep forensic analysis.
    """
    
    def __init__(self, github_token: str = None):
        super().__init__(name="Commit")
        self.github_token = github_token

    def analyze(self, payload: Dict[str, Any]) -> CommitSignal:
        github_url = payload.get("github_url", "")
        if not github_url:
            return CommitSignal(commit_risk_score=1.0)

        from engine.core.commitAnalyzer import CommitForensicsAnalyzer
        analyzer = CommitForensicsAnalyzer(github_token=self.github_token)
        report = analyzer.analyze(github_url)
        
        signal = CommitSignal()
        signal.total_commits = report.total_commits
        signal.total_lines_added = report.total_lines_added
        signal.total_lines_deleted = report.total_lines_deleted
        signal.first_commit_date = report.first_commit_date
        signal.last_commit_date = report.last_commit_date
        signal.development_span_days = report.development_span_days
        signal.average_lines_per_commit = report.average_lines_per_commit
        signal.largest_single_commit_lines = report.largest_single_commit_lines
        signal.commit_frequency_per_day = report.commit_frequency_per_day
        
        # New Cognitive Metadata
        signal.commit_risk_score = float(1.0 - report.authenticity_score) # Flip for risk
        signal.suspicious_commit_flag = report.risk_level in ["HIGH", "CRITICAL"]
        signal.suspicion_reasons = report.suspicious_events + report.timeline_anomalies
        
        # Skill Evolution mapping
        signal.skill_evolution_score = report.skill_evolution_score
        
        return signal
