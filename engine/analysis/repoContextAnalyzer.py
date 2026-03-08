"""
REPOSITORY CONTEXT DETECTOR — Phase 1
repoContextAnalyzer.py

Detects the true nature of the repository based on directory structure,
files like package.json, requirements.txt, pom.xml, etc.
"""

import os
import json
from typing import Dict, Any, List

class RepoContextAnalyzer:
    def __init__(self):
        pass

    def analyze(self, files: List[Dict[str, str]], github_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Takes a list of files and optional GitHub metadata.
        Returns strict repository classification or REJECTED status.
        """
        if not files:
            return {"verdict": "REJECTED", "reason": "Empty repository"}

        paths = [f['path'] for f in files]
        # Ignore common config/lock files for density checks
        source_files = [p for p in paths if p.split('.')[-1] in ['py', 'js', 'ts', 'tsx', 'jsx', 'java', 'cpp', 'go', 'rs']]
        
        if not source_files:
            return {"verdict": "REJECTED", "reason": "No source code files detected (README-only or config-only repo)"}

        # 1. Detect LeetCode/Competitive Programming Only Profiles
        dsa_pattern_count = 0
        for p in paths:
            file_name = p.split('/')[-1].lower()
            if any(char.isdigit() for char in file_name) and '-' in file_name:
                dsa_pattern_count += 1
            if any(kw in p.lower() for kw in ['leetcode', 'hackerrank', 'codewars', 'algorithm', 'solutions']):
                dsa_pattern_count += 1
        
        source_density = len(source_files)
        if dsa_pattern_count > 10 and dsa_pattern_count / source_density > 0.8:
            return {"verdict": "REJECTED", "reason": "LeetCode/Competitive Programming Profile (Not a project repo)"}

        # 2. Extract context from github_data if available
        is_fork = github_data.get('fork', False) if github_data else False
        has_modifications = True # Need commit analysis to verify if fork
        
        repo_type = "Personal Project"
        structure = "general_structure"
        
        # 3. Detect Tutorial / Follow-along (High density of 'tutorial', 'course', 'boilerplate' in paths/README)
        full_readme = "".join([f['content'].lower() for f in files if f['path'].lower() == 'readme.md'])
        tutorial_keywords = ['tutorial', 'follow-along', 'course-work', 'udemy', 'boilerplate', 'starter-kit']
        if any(kw in full_readme for kw in tutorial_keywords) or any(kw in " ".join(paths).lower() for kw in tutorial_keywords):
            repo_type = "Tutorial / Follow-along"
            
        folders = set()
        for p in paths:
            parts = p.split('/')
            if len(parts) > 1:
                folders.update(parts[:-1])

        # 4. Framework Detection
        has_package_json = any(p.endswith('package.json') for p in paths)
        if has_package_json:
            for f in files:
                if f['path'].endswith('package.json'):
                    try:
                        pkg = json.loads(f['content'])
                        deps = {**pkg.get('dependencies', {}), **pkg.get('devDependencies', {})}
                        if 'react' in deps: 
                            repo_type = "Web Application (React)"
                            structure = "react_modular"
                        if 'express' in deps:
                            repo_type = "Backend API (Express)"
                    except: pass

        if 'frontend' in folders and 'backend' in folders:
            repo_type = "Fullstack Web Application"
            structure = "split_monorepo"

        return {
            "verdict": "PROCEED",
            "repo_type": repo_type,
            "structure": structure,
            "is_fork": is_fork,
            "source_file_count": len(source_files),
            "context": {
                "original_work": not is_fork,
                "type": "project" if repo_type != "Tutorial / Follow-along" else "educational"
            }
        }
