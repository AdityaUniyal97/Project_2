import os
import subprocess
import shutil
from typing import Optional

class GitHubClient:
    """
    Utility for interacting with GitHub.
    Isolated from agent logic. Handles auth and cloning safely.
    """
    def __init__(self, token: Optional[str] = None):
        # Allow future support for private repos via injected token
        self.token = token or os.environ.get("GITHUB_TOKEN")

    def clone_repository(self, repo_url: str, target_dir: str) -> bool:
        """
        Clones a GitHub repository into the target directory.
        Injects token if available for private repo support.
        """
        try:
            clone_url = repo_url
            if self.token and repo_url.startswith("https://"):
                # Inject token for authentication: https://<token>@github.com/...
                clone_url = repo_url.replace("https://", f"https://{self.token}@")

            # Run git clone shallow (depth 1) to save massive amounts of time and bandwidth
            # Note: The Commit Agent might need full history, so we might need to separate
            # 'shallow clone for code' vs 'fetch history via API for commits' later.
            # But for the Preprocessing Agent, we only need the latest code.
            command = ["git", "clone", "--depth", "1", clone_url, target_dir]
            
            result = subprocess.run(
                command, 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE, 
                text=True
            )
            
            if result.returncode != 0:
                print(f"[GitHubClient] Error cloning {repo_url}: {result.stderr}")
                return False
                
            return True
            
        except Exception as e:
            print(f"[GitHubClient] Exception during clone: {e}")
            return False

    def cleanup(self, target_dir: str):
        """Safely removes the cloned directory."""
        if os.path.exists(target_dir):
            shutil.rmtree(target_dir, ignore_errors=True)
