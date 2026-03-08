from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import sys
import os
import uuid
from pathlib import Path
from typing import Dict, List, Any
from dotenv import load_dotenv
from pydantic import BaseModel

# Absolute .env Path Enforcement
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path)

print("ENV LOADED:", bool(os.getenv("GEMINI_API_KEY")))

if not os.getenv("GEMINI_API_KEY"):
    print("GEMINI_API_KEY not detected at startup")
    raise RuntimeError("GEMINI_API_KEY not detected at startup")

# Ensure the engine module can be imported correctly when running uvicorn from the root directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from engine.models.payload import AnalysisRequestPayload
from engine.models.schema import AnalysisResult
from engine.orchestrator.main_orchestrator import AnalysisOrchestrator
from engine.registry.registry_store import RegistryStore
from engine.llm.gemini_provider import GeminiProvider
from engine.agents.preprocessing.preprocessing_agent import PreprocessingAgent
from engine.agents.similarity.hash_similarity_agent import HashSimilarityAgent
from engine.agents.commit.commit_agent import CommitAgent
from engine.agents.verdict_agent import VerdictAgent
from engine.sandbox.sandbox_executor import sandbox

app = FastAPI(
    title="ProjectGuard AI Engine",
    description="The core mathematical and behavioral intelligence service for academic plagiarism detection.",
    version="2.0.0"
)

# Standard local development CORS to allow React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Change to pure UI origin in Production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Registry Database Instantiation
# Real production would use a connection pool or DI dependency here
registry = RegistryStore("project_guard_registry.db")
llm_provider = GeminiProvider()


@app.post("/analyze", response_model=dict)
async def analyze_project(payload: AnalysisRequestPayload):
    """
    Main Endpoint for the Intelligence Pipeline.
    Strictly isolated from intelligence layers. It only acts as a router.
    """
    try:
        if not payload.project_id or not payload.github_url or not payload.analysis_mode:
            error_result = AnalysisResult()
            error_result.overall_risk_level = "ERROR"
            error_result.summary = "Missing required fields (project_id, github_url, analysis_mode) completely."
            return JSONResponse(status_code=400, content=error_result.to_dict())

        if not str(payload.github_url).startswith("https://github.com/"):
            error_result = AnalysisResult()
            error_result.overall_risk_level = "ERROR"
            error_result.summary = "Invalid GitHub URL. Must start with 'https://github.com/'."
            return JSONResponse(status_code=400, content=error_result.to_dict())

        # Architecture DI: We wire the Orchestrator per-request to keep state safe
        orchestrator = AnalysisOrchestrator(mode=payload.analysis_mode)
        
        # Load the Intelligence Pillars
        from engine.agents.web.web_agent import WebAgent
        from engine.agents.ai_detection.ai_detection_agent import AIDetectionAgent
        from engine.agents.code_quality.code_quality_agent import CodeQualityAgent

        orchestrator.register_agent(PreprocessingAgent())
        orchestrator.register_agent(HashSimilarityAgent(registry))
        orchestrator.register_agent(CommitAgent())
        orchestrator.register_agent(WebAgent())
        orchestrator.register_agent(AIDetectionAgent())
        orchestrator.register_agent(CodeQualityAgent())
        orchestrator.register_agent(VerdictAgent(llm_provider))

        # Convert the Pydantic Payload to a flat dict before passing it purely
        raw_payload = payload.model_dump()
        
        # Execute the brain
        final_result_dict = orchestrator.analyze_submission(raw_payload)

        # The Orchestrator strictly returns the generated AnalysisResult mapped to a `.to_dict()`
        return JSONResponse(content=final_result_dict)

    except Exception as e:
        # 🚨 SAFETY NET: The API must never crash the UI
        # We always return the expected 'AnalysisResult' format, but force 'ERROR' states
        
        print(f"[API Layer Crash Prevention]: {str(e)}")
        import traceback
        traceback.print_exc()
        
        error_result = AnalysisResult()
        error_result.overall_risk_level = "ERROR"
        error_result.summary = f"The Backend Intelligence Layer suffered a catastrophic failure: {str(e)}"
        
        # Return 200 or 500, but preserve the contract schema so the React UI renders the crash gracefully
        # We keep status code 200 with an ERROR body so React correctly renders the "Error" UI instead of a generic network blank out.
        return JSONResponse(status_code=200, content=error_result.to_dict())


@app.get("/health")
async def health_check():
    """Simple ping to ensure the AI container is alive."""
    return {"status": "online", "registry_mode": "SQLite", "llm": "Gemini 1.5", "sandbox": "active"}


class ExecuteChallengePayload(BaseModel):
    """Payload for live coding challenge execution."""
    challenge_id: str = ""
    student_code: str
    language: str  # "python" | "javascript"
    test_cases: List[Dict[str, Any]]



class SemanticMatchPayload(BaseModel):
    code: str
    explanation: str
    language: str = "javascript"

@app.post("/analyze/semantic-match")
async def analyze_semantic_match(payload: SemanticMatchPayload):
    from engine.analysis.semanticMismatchDetector import SemanticMismatchDetector
    detector = SemanticMismatchDetector()
    try:
        result = detector.analyze(payload.code, payload.explanation, payload.language)
        return JSONResponse(content=result)
    except Exception as e:
        print(f"[SemanticMatch Error] {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

class VivaPayload(BaseModel):
    viva_response: str
    project_context: str = ""

@app.post("/analyze-viva")
async def analyze_viva_response(payload: VivaPayload):
    import asyncio
    await asyncio.sleep(2) # Strict loading state simulation
    # Simple semantic scoring heuristic proxy for LLM
    text = payload.viva_response.lower()
    length = len(text)
    score = 70
    if length < 50: score -= 30
    if length > 200: score += 15
    if any(kw in text for kw in ['schema', 'database', 'architecture', 'query', 'auth', 'logic', 'component']):
        score += 10
    score = min(this_score := score, 100)
    score = max(score, 0)
    return JSONResponse(content={"score": score, "status": "COMPLETED"})

@app.post("/execute-challenge")
async def execute_challenge(payload: ExecuteChallengePayload):
    """
    Execute student's live coding solution in a language-aware env.
    Returns pass/fail results for each test case.
    """
    try:
        from engine.sandbox.executionRouter import ExecutionRouter
        router = ExecutionRouter()
        
        if not payload.student_code.strip():
            return JSONResponse(status_code=400, content={
                "success": False,
                "errors": "No code submitted.",
                "verdict": "ERROR"
            })

        # Add .jsx mock file to trigger react bypass if language equals react
        filename = "main"
        if "react" in payload.language.lower():
            filename = "main.jsx"
            
        result = router.execute_code(
            code=payload.student_code,
            language=payload.language,
            test_cases=payload.test_cases,
            filename=filename
        )

        # Merge results into standard response structure
        return JSONResponse(content={
            "challenge_id": payload.challenge_id or str(uuid.uuid4()),
            **result
        })

    except Exception as e:
        print(f"[Sandbox API Error]: {str(e)}")
        return JSONResponse(status_code=200, content={
            "success": False,
            "passed_tests": 0,
            "total_tests": len(payload.test_cases),
            "test_results": [],
            "errors": f"Sandbox execution error: {str(e)}",
            "verdict": "ERROR"
        })
@app.post("/analyze/generate-viva")
async def generate_viva_questions(payload: AnalysisRequestPayload):
    """
    PHASE 3: ADVERSARIAL INTERROGATION PROTOCOL
    Generates target questions from the 3-Agent system (Challenger, Deep Diver, Pattern Analyzer).
    """
    try:
        from engine.agents.preprocessing.preprocessing_agent import PreprocessingAgent
        from engine.analysis.interrogationEngine import InterrogationEngine
        
        pre = PreprocessingAgent()
        project_map = pre.analyze(payload.model_dump())
        
        engine = InterrogationEngine()
        result = engine.generate_from_repository(project_map)
        
        return JSONResponse(content=result)
    except Exception as e:
        print(f"[Viva Generation Error]: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

class ConsciousnessPayload(BaseModel):
    github_url: str

@app.post("/api/consciousness/analyze")
async def analyze_consciousness(payload: ConsciousnessPayload):
    """
    PHASE 1: QUANTUM COMMIT ARCHAEOLOGY
    Endpoint to reconstruct developer consciousness from git commit history.
    """
    from engine.consciousness.commit_archaeologist import QuantumCommitArchaeologist
    try:
        archaeologist = QuantumCommitArchaeologist()
        result = archaeologist.analyze_repository(payload.github_url)
        if "error" in result:
            return JSONResponse(status_code=500, content=result)
        return JSONResponse(content=result)
    except Exception as e:
        print(f"[Consciousness engine error]: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

class TribunalQuestionsPayload(BaseModel):
    submission_id: str
    consciousness_timeline: Dict[str, Any] = {}
    anomalies: List[Dict[str, Any]] = []

@app.post("/api/tribunal/generate-questions")
async def generate_tribunal_questions(payload: TribunalQuestionsPayload):
    from engine.interrogation.tribunal import AdversarialTribunal
    try:
        tribunal = AdversarialTribunal()
        questions = tribunal.generate_targeted_questions(
            consciousness_timeline=payload.consciousness_timeline,
            anomalies=payload.anomalies
        )
        return JSONResponse(content={"questions": questions, "status": "SUCCESS"})
    except Exception as e:
        print(f"[Tribunal error]: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

class TribunalEvaluatePayload(BaseModel):
    agent_id: str
    question: str
    student_answer: str
    code_context: str = ""

@app.post("/api/tribunal/evaluate-answer")
async def evaluate_tribunal_answer(payload: TribunalEvaluatePayload):
    from engine.interrogation.tribunal import AdversarialTribunal
    try:
        tribunal = AdversarialTribunal()
        agent = tribunal.agents.get(payload.agent_id)
        if not agent:
            return JSONResponse(status_code=400, content={"error": f"Agent {payload.agent_id} not found"})
            
        verdict = agent.evaluate(
            question=payload.question,
            answer=payload.student_answer,
            context=payload.code_context
        )
        return JSONResponse(content={"verdict": verdict})
    except Exception as e:
        print(f"[Tribunal evaluate error]: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

class TribunalVerdictPayload(BaseModel):
    submission_id: str
    all_agent_verdicts: List[Dict[str, Any]]

@app.post("/api/tribunal/final-verdict")
async def tribunal_final_verdict(payload: TribunalVerdictPayload):
    from engine.interrogation.tribunal import AdversarialTribunal
    try:
        tribunal = AdversarialTribunal()
        final_verdict = tribunal.compute_consensus(payload.all_agent_verdicts)
        return JSONResponse(content={"final_verdict": final_verdict})
    except Exception as e:
        print(f"[Tribunal consensus error]: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

class SaboteurGeneratePayload(BaseModel):
    submission_id: str
    repository_context: str = ""
    anomaly: Dict[str, Any] = {}

@app.post("/api/saboteur/generate-challenge")
async def generate_saboteur_challenge(payload: SaboteurGeneratePayload):
    from engine.interrogation.saboteur import SaboteurEngine
    try:
        engine = SaboteurEngine()
        challenge = engine.generate_challenge(payload.repository_context, payload.anomaly)
        return JSONResponse(content={"challenge": challenge, "status": "SUCCESS"})
    except Exception as e:
        print(f"[Saboteur generate error]: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

class SaboteurSubmitPayload(BaseModel):
    challenge_id: str
    student_fix: str
    explanation: str
    bug_type: str
    expected_fix: str
    time_taken: int = 0

@app.post("/api/saboteur/submit-fix")
async def evaluate_saboteur_fix(payload: SaboteurSubmitPayload):
    from engine.interrogation.saboteur import SaboteurEngine
    try:
        engine = SaboteurEngine()
        result = engine.evaluate_debugging_response(
            student_fix=payload.student_fix,
            expected_fix=payload.expected_fix,
            bug_type=payload.bug_type,
            explanation=payload.explanation
        )
        return JSONResponse(content={"evaluation": result, "status": "SUCCESS"})
    except Exception as e:
        print(f"[Saboteur evaluate error]: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

class SaboteurHintPayload(BaseModel):
    challenge_id: str

@app.post("/api/saboteur/request-hint")
async def request_saboteur_hint(payload: SaboteurHintPayload):
    return JSONResponse(content={
        "hint": "Focus on the cleanup phase of the lifecycle hook. What happens when the component unmounts?",
        "penalty_applied": 10
    })

class ChallengeGeneratePayload(BaseModel):
    submission_id: str
    repository_context: str = ""
    risk_scores: Dict[str, Any] = {}

@app.post("/api/challenges/generate")
async def generate_live_challenges(payload: ChallengeGeneratePayload):
    from engine.challenges.adaptive_generator import AdaptiveChallengeGenerator
    try:
        engine = AdaptiveChallengeGenerator()
        challenges = engine.generate_challenges(payload.repository_context, payload.risk_scores)
        return JSONResponse(content={"challenges": challenges, "status": "SUCCESS"})
    except Exception as e:
        print(f"[AdaptiveGenerate error]: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

class ChallengeSubmitPayload(BaseModel):
    challenge: Dict[str, Any]
    student_solution: str
    behavioral_data: Dict[str, Any]

@app.post("/api/challenges/submit")
async def evaluate_live_challenge(payload: ChallengeSubmitPayload):
    from engine.challenges.adaptive_generator import AdaptiveChallengeGenerator
    try:
        engine = AdaptiveChallengeGenerator()
        result = engine.evaluate_live_coding(
            student_solution=payload.student_solution,
            challenge=payload.challenge,
            behavioral_data=payload.behavioral_data
        )
        return JSONResponse(content={"evaluation": result, "status": "SUCCESS"})
    except Exception as e:
        print(f"[AdaptiveEvaluate error]: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
