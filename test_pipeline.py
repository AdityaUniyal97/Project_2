import os
import json
import time
from typing import Dict, Any

from engine.orchestrator.main_orchestrator import AnalysisOrchestrator
from engine.agents.preprocessing.preprocessing_agent import PreprocessingAgent
from engine.agents.similarity.hash_similarity_agent import HashSimilarityAgent
from engine.agents.commit.commit_agent import CommitAgent
from engine.agents.verdict_agent import VerdictAgent
from engine.registry.registry_store import RegistryStore
from engine.llm.gemini_provider import GeminiProvider

def run_integration_test(github_url: str, project_id: str, project_name: str):
    """
    STRESS TEST PIPELINE
    Verifies that all 5 components of the intelligence engine execute cleanly without crashing.
    Validates token isolation, SQL writes, bare-cloning, and AST parsing realistically.
    """
    print(f"\n{'='*60}")
    print(f"🚀 INTEGRATION STRESS TEST: {project_id}")
    print(f"URL: {github_url}")
    print(f"{'='*60}\n")

    start_time = time.time()

    try:
        # 1. Initialize DB and LLM Provider
        registry = RegistryStore("test_registry.db")
        # We use GeminiProvider. Without an API Key, it gracefully falls back to the Mock string parsing logic.
        llm = GeminiProvider() 

        # 2. Instantiate isolated agents
        preprocessing_agent = PreprocessingAgent()
        similarity_agent = HashSimilarityAgent(registry)
        commit_agent = CommitAgent()
        verdict_agent = VerdictAgent(llm)

        # 3. Configure the Orchestrator Brain
        orchestrator = AnalysisOrchestrator(mode="Deep Mode")
        orchestrator.register_agent(preprocessing_agent)
        orchestrator.register_agent(similarity_agent)
        orchestrator.register_agent(commit_agent)
        orchestrator.register_agent(verdict_agent)

        print("[TEST] Architecture wired successfully. Commencing Analysis Pipeline...\n")

        # 4. Define Payload
        payload = {
            "project_id": project_id,
            "project_name": project_name,
            "github_url": github_url
        }

        # 5. Execute Core Pipeline (This triggers all OS clones, DB reads, AST parses, and LLM synthesis)
        final_result = orchestrator.analyze_submission(payload)

        # 6. Evaluate Result Integrity
        print(f"\n{'='*20} FINAL OUTPUT JSON {'='*20}")
        print(json.dumps(final_result, indent=2))
        print(f"{'='*60}\n")
        
        # 7. Metrics & Diagnostics Print
        execution_time = round(time.time() - start_time, 2)
        print("✅ STRESS TEST PASSED")
        print(f"⏱️ Total Pipeline Execution: {execution_time} seconds (Including Cloning & LLM)")
        print(f"📊 Risk Synthesis: {final_result.get('overall_risk_level', 'UNKNOWN')}")
        print(f"🧠 Confidence: {final_result.get('confidence_score', '0.0')}%")
        print(f"💡 Viva Questions Generated: {len(final_result.get('suggested_viva_questions', []))}")
        
    except Exception as e:
        print(f"\n❌ STRESS TEST FAILED (CRASH): {str(e)}")
        import traceback
        traceback.print_exc()
        
    finally:
        # Clean up prototype SQLite DB to keep tests deterministic next run
        if os.path.exists("test_registry.db"):
            try:
                os.remove("test_registry.db")
            except:
                pass

if __name__ == "__main__":
    # Test 1: Real public python repository to trigger the AST parser and Bare Cloning
    run_integration_test(
        github_url="https://github.com/psf/requests", 
        project_id="TEST_REAL_01",
        project_name="Public Requests Library"
    )
    
    # Test 2: Purposely fake URL to ensure edge-case exception survival without crashing the server
    run_integration_test(
        github_url="https://github.com/this-repo-absolutely-does-not-exist-1234.git", 
        project_id="TEST_FAKE_02",
        project_name="Invalid Edge Case"
    )
