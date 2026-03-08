import os
import tempfile
from typing import Dict, Any, List
from engine.agents.base_agent import BaseAgent
from engine.models.signals import ProjectMap, ParsedFile
from engine.utils.github_client import GitHubClient
from engine.utils.file_cleaner import FileCleaner
from engine.utils.hashing import Hashing

class PreprocessingAgent(BaseAgent):
    """
    Agent 1: Code Preprocessing
    The very first stage of intelligence. 
    It doesn't calculate similarity. It only clones, cleans, extracts, and maps.
    """
    
    def __init__(self, github_token: str = None):
        super().__init__(name="Preprocessing")
        # Injected the GitHub client with optional token support for private repos
        self.github = GitHubClient(token=github_token)

    def analyze(self, payload: Dict[str, Any]) -> ProjectMap:
        """
        Payload expects:
        {
            "project_id": "STD_10294",
            "project_name": "Operating Systems Scheduler",
            "github_url": "https://github.com/student/os-project"
        }
        """
        github_url = payload.get("github_url", "")
        if github_url is None: github_url = ""
        project_id = payload.get("project_id", "UNKNOWN_ID")
        if project_id is None: project_id = "UNKNOWN_ID"
        project_name = payload.get("project_name", "UNKNOWN_PROJECT")
        if project_name is None: project_name = "UNKNOWN_PROJECT"
        
        project_map = ProjectMap(
            project_id=str(project_id),
            project_name=str(project_name),
            github_url=str(github_url)
        )

        if not github_url:
            project_map.error = "No GitHub URL provided."
            return project_map

        # Standard practice: use temporary directories that OS cleans up
        temp_dir = tempfile.mkdtemp(prefix=f"pg_ai_{project_id}_")
        
        try:
            # 1. Clone the repository
            success = self.github.clone_repository(github_url, temp_dir)
            if not success:
                project_map.error = "Failed to clone repository. (Private repo without token or invalid URL)"
                return project_map

            file_hashes = []
            
            # 2. Walk, Filter, and Read Files
            for root, dirs, files in os.walk(temp_dir):
                # SUPER FAST SKIP — prevent scanning 10000+ files in node_modules or .git
                dirs[:] = [d for d in dirs if d not in {
                    'node_modules', '.git', 'venv', 'env', '__pycache__', 
                    'build', 'dist', 'target', '.next', 'out'
                }]
                
                for file in files:
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_path, temp_dir)
                    
                    # Basic OS stats
                    try:
                        size_bytes = os.path.getsize(file_path)
                    except OSError:
                        continue # Skip inaccessible files

                    if not FileCleaner.is_valid_file(rel_path, size_bytes):
                        continue
                        
                    ext = os.path.splitext(rel_path)[1]
                    
                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            raw_content = f.read()
                            
                        # 3. Clean and Normalize Source Code
                        clean_content = FileCleaner.clean_code(raw_content, ext)
                        
                        from engine.utils.ast_parser import ASTParser
                        
                        # Empty logic (like files with only comments) should be skipped
                        if not clean_content: continue
                            
                        # 4. Hash File Logic
                        file_hash = Hashing.generate_sha256(clean_content)
                        file_hashes.append(file_hash)
                        
                        # 5. Extract Functions for Structural Overlap (Phase 1: Python Only)
                        functions = []
                        if ext == '.py':
                            functions = ASTParser.parse_python_functions(raw_content, rel_path)
                        
                        # Build File Structure Object
                        parsed_file = ParsedFile(
                            path=rel_path,
                            content=clean_content,
                            hash=file_hash,
                            size=size_bytes,
                            functions=functions
                        )
                        
                        project_map.files.append(parsed_file)
                        project_map.total_files += 1

                    except Exception as e:
                        print(f"[{self.name}] Skipped {rel_path} due to error: {e}")

            # 5. Generate Universal Commutative Project Signature
            project_map.project_signature = Hashing.hash_commutative(file_hashes)

            # 6. Analyze Repository Context and Language Distribution
            try:
                from engine.analysis.repoContextAnalyzer import RepoContextAnalyzer
                from engine.analysis.languageAnalyzer import LanguageAnalyzer
                
                # Convert ParsedFiles to dicts for analyzers
                file_dicts = [{"path": f.path, "content": f.content} for f in project_map.files]
                
                repo_context_analyzer = RepoContextAnalyzer()
                project_map.repo_context = repo_context_analyzer.analyze(file_dicts)
                
                lang_analyzer = LanguageAnalyzer()
                project_map.language_distribution = lang_analyzer.analyze(file_dicts)
                
            except Exception as e:
                print(f"[{self.name}] Failed to extract deep language/repo context: {e}")

        finally:
            # 6. Cleanup to prevent server storage explosion
            self.github.cleanup(temp_dir)
            
        return project_map
