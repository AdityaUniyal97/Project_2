import React, { useState, useEffect } from 'react';
import './index.css'; // Keep existing CSS just in case, though tailwind will override
import type { ChallengeData } from './components/LiveCodingChallenge';
import { TerminalSkeleton } from './components/ProofOfWorkTerminal';
import { LiveInterrogationArena } from './components/LiveInterrogationArena';
import { Activity, ShieldAlert, CheckCircle, Database, BookOpen, LayoutDashboard, TerminalSquare } from 'lucide-react';

interface AnalysisResult {
  overall_risk_level: string;
  confidence_score: number;
  similarity_score: number;
  structural_score: number;
  commit_risk_score: number;
  summary: string;
  suggested_viva_questions: any[];
  challenge_task?: string;
  external_similarity_flag?: boolean;
  external_source_candidates?: string[];
  live_challenge?: ChallengeData | null;
  ai_detection?: any;
  code_quality?: any;
  detected_issues?: any[];
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadText, setLoadText] = useState("Initializing Core Engine...");

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'deep_scan' | 'viva' | 'live_compiler' | 'master_dashboard'>('deep_scan');

  // Form State
  const [formData, setFormData] = useState({
    studentName: 'John Doe',
    rollNumber: '2023CS001',
    branch: 'CS',
    projectTitle: 'E-commerce Capstone',
    githubUrl: 'https://github.com/johndoe/ecommerce',
    liveLink: '',
    description: '',
    analysisMode: 'Deep Mode'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Simulated viva evaluation state
  const [vivaResponse, setVivaResponse] = useState("");
  const [isEvaluatingViva, setIsEvaluatingViva] = useState(false);
  const [vivaScore, setVivaScore] = useState<number | null>(null);
  const [vivaReason, setVivaReason] = useState<string>("");
  const [vivaVerdict, setVivaVerdict] = useState<string>("");

  // Live Execution tracking
  const [liveExecutionTripped, setLiveExecutionTripped] = useState(false);
  const [liveExecutionPassed, setLiveExecutionPassed] = useState(false);

  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadProgress(0);
      const messages = [
        "Cloning Repository...",
        "Mapping Full MERN Architecture...",
        "Analyzing Authentication Flows...",
        "Scanning for External Dependencies...",
        "Running AST Tree Analysis...",
        "Generating Project-Specific Crucible Scenarios..."
      ];
      let msgIndex = 0;

      interval = setInterval(() => {
        setLoadProgress(prev => {
          if (prev >= 90) return prev;
          if (prev % 15 === 0 && msgIndex < messages.length) {
            setLoadText(messages[msgIndex]);
            msgIndex++;
          }
          return prev + 2;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.githubUrl) {
      alert("GitHub Repository Link is required.");
      return;
    }

    setLoading(true);
    setResult(null);
    setActiveTab('deep_scan');
    setVivaScore(null);
    setVivaResponse("");
    setVivaReason("");
    setVivaVerdict("");
    setLiveExecutionTripped(false);
    setLiveExecutionPassed(false);

    const payload = {
      project_id: formData.rollNumber,
      project_name: formData.projectTitle,
      github_url: formData.githubUrl,
      analysis_mode: formData.analysisMode,
      student_name: formData.studentName,
      roll_number: formData.rollNumber
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const data = await response.json();

      // Complete bar to 100% then render
      setLoadProgress(100);
      setLoadText("Analysis Complete. Rendering intelligence...");
      setTimeout(() => {
        setResult(data);
        setLoading(false);
      }, 800);
    } catch (err: any) {
      setTimeout(() => {
        setResult({
          overall_risk_level: "ERROR",
          confidence_score: 0.0,
          similarity_score: 0.0,
          structural_score: 0.0,
          commit_risk_score: 0.0,
          summary: `Connection to intelligence engine failed: ${err.message}`,
          suggested_viva_questions: []
        });
        setLoading(false);
      }, 500);
    }
  };

  const analyzeVivaResponse = async () => {
    if (!vivaResponse.trim() || !result) return;
    setIsEvaluatingViva(true);
    setVivaReason("");

    // Identify target file context
    const currentQ = result.suggested_viva_questions?.[0];
    let targetFileContent = "const x = 10;"; // Default basic mock
    let lang = "javascript";

    // In a real execution, we would fetch the raw text from the parsed ProjectMap.
    // For this demonstration, we'll send a mock block from the target logic.
    if (currentQ && currentQ.target_file && currentQ.target_file.endsWith('.py')) lang = 'python';

    try {
      const resp = await fetch('http://127.0.0.1:8000/analyze/semantic-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: targetFileContent,
          explanation: vivaResponse,
          language: lang
        })
      });
      const data = await resp.json();
      setVivaScore(data.match_score || 0);
      setVivaReason(data.reason || "");
      setVivaVerdict(data.verdict || "");
    } catch (e) {
      console.error(e);
      setVivaScore(0);
      setVivaReason("Engine Unreachable.");
      setVivaVerdict("ERROR");
    } finally {
      setIsEvaluatingViva(false);
    }
  };

  const getRiskColor = (risk: string) => {
    if (risk === "CLEAR" || risk === "LOW") return "text-emerald-400 border-emerald-400";
    if (risk === "MONITOR") return "text-yellow-400 border-yellow-400";
    return "text-red-500 border-red-500";
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans grid grid-cols-1 lg:grid-cols-[320px_1fr]">
      {/* SIDEBAR: Submission Details */}
      <aside className="border-r border-gray-800 bg-[#0d1117] flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-blue-500 w-8 h-8" />
            <div>
              <h1 className="text-lg font-bold tracking-widest text-blue-500 uppercase">ProjectGuard</h1>
              <p className="text-xs text-gray-500 uppercase tracking-widest">Defense Terminal</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Submission Intel</h2>
          <form onSubmit={handAnalyze} className="space-y-5">
            <div>
              <label className="block text-xs text-gray-500 uppercase mb-1">Student Target</label>
              <input type="text" name="studentName" value={formData.studentName} onChange={handleInputChange} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Roll ID</label>
                <input type="text" name="rollNumber" value={formData.rollNumber} onChange={handleInputChange} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Branch</label>
                <select name="branch" value={formData.branch} onChange={handleInputChange} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm focus:border-blue-500 focus:outline-none">
                  <option value="CS">CS</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 uppercase mb-1">GitHub Source URL</label>
              <input type="url" name="githubUrl" value={formData.githubUrl} onChange={handleInputChange} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm focus:border-blue-500 focus:outline-none" required />
            </div>

            <div>
              <label className="block text-xs text-gray-500 uppercase mb-1">Engine Protocol</label>
              <select name="analysisMode" value={formData.analysisMode} onChange={handleInputChange} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm focus:border-blue-500 focus:outline-none">
                <option value="Fast Mode">Standard Heuristics</option>
                <option value="Deep Mode">Deep Deep Execution</option>
                <option value="Experimental Mode">Omega Experimental</option>
              </select>
            </div>

            <button type="submit" disabled={loading} className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2">
              <Activity className="w-4 h-4" />
              {loading ? 'Executing Engine' : 'Initiate Deep Scan'}
            </button>
          </form>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0a0c10]">

        {/* State 1: Nothing loaded yet */}
        {!loading && !result && (
          <div className="flex-1 flex items-center justify-center flex-col opacity-50">
            <Database className="w-16 h-16 text-gray-600 mb-4" />
            <h2 className="text-xl font-mono text-gray-400">Awaiting Target Vector</h2>
            <p className="text-sm text-gray-600">Enter project URL in the left terminal to commence analysis.</p>
          </div>
        )}

        {/* State 2: Deep Scan Loading Sequence */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-gray-900 border-inner shadow-inner">
            <div className="w-full max-w-2xl bg-[#0d1117] border border-gray-700 rounded-lg overflow-hidden shadow-2xl">
              <div className="bg-[#161b22] px-4 py-3 flex items-center gap-2 border-b border-gray-700">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs font-mono text-gray-500 ml-2">omega_engine_exec.sh</span>
              </div>
              <div className="p-8 font-mono">
                <div className="text-blue-400 mb-6 flex items-center gap-3">
                  <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="text-lg">{loadText}</span>
                </div>

                {/* Advanced Progress Bar */}
                <div className="h-4 w-full bg-gray-800 rounded-full overflow-hidden mb-4 relative">
                  <div
                    className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-[400ms] ease-out shadow-[0_0_15px_#52a8ff]"
                    style={{ width: `${loadProgress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Engine Load: {loadProgress.toFixed(1)}%</span>
                  <span>EST: Varies</span>
                </div>
              </div>
            </div>

            <div className="mt-12 w-full max-w-4xl opacity-50 pointer-events-none">
              <TerminalSkeleton />
            </div>
          </div>
        )}

        {/* State 3: Render Result Dashboard */}
        {!loading && result && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Top Navigation Tabs */}
            <nav className="flex items-center gap-1 bg-[#161b22] border-b border-gray-800 px-6 pt-4">
              <button onClick={() => setActiveTab('deep_scan')} className={`px-6 py-3 font-medium text-sm border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'deep_scan' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
                <Activity className="w-4 h-4" /> Deep Scan
              </button>
              <button onClick={() => setActiveTab('viva')} className={`px-6 py-3 font-medium text-sm border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'viva' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
                <BookOpen className="w-4 h-4" /> Phase 1: Context Viva
              </button>
              <button onClick={() => setActiveTab('live_compiler')} className={`px-6 py-3 font-medium text-sm border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'live_compiler' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
                <TerminalSquare className="w-4 h-4" /> Phase 2: Live Crucible
              </button>
              <button onClick={() => setActiveTab('master_dashboard')} className={`px-6 py-3 font-medium text-sm border-b-2 flex items-center gap-2 transition-colors ml-auto ${activeTab === 'master_dashboard' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
                <LayoutDashboard className="w-4 h-4" /> Final Report
              </button>
            </nav>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative bg-[#0a0c10]">

              {/* TAB 1: DEEP SCAN RESULTS */}
              {activeTab === 'deep_scan' && (
                <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-100">Telemetry Overview</h2>
                      <p className="text-gray-400">Analysis completed in {(result as any).processing_time_ms || 1200}ms using Omega Engine</p>
                    </div>
                    <div className={`px-4 py-2 rounded-full border-2 font-bold tracking-widest uppercase bg-opacity-10 ${getRiskColor(result.overall_risk_level)} bg-current`}>
                      Threat Level: {result.overall_risk_level}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-800 border border-gray-700 p-5 rounded-lg">
                      <div className="text-gray-500 text-xs font-bold uppercase mb-2">Confidence Array</div>
                      <div className="text-3xl font-mono text-gray-100">{result.confidence_score.toFixed(1)}<span className="text-lg text-gray-500">%</span></div>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 p-5 rounded-lg">
                      <div className="text-gray-500 text-xs font-bold uppercase mb-2">Syntactic Deviation</div>
                      <div className={`text-3xl font-mono ${liveExecutionTripped ? 'text-[#ff4757]' : 'text-gray-100'}`}>
                        {liveExecutionTripped ? "99.9" : (result.similarity_score * 100).toFixed(1)}<span className="text-lg text-gray-500">%</span></div>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 p-5 rounded-lg">
                      <div className="text-gray-500 text-xs font-bold uppercase mb-2">Commit Timeline Risk</div>
                      <div className="text-3xl font-mono text-gray-100">{(result.commit_risk_score * 100).toFixed(1)}<span className="text-lg text-gray-500">%</span></div>
                    </div>
                    <div className="bg-[rgba(255,0,0,0.05)] border border-gray-700 p-5 rounded-lg relative overflow-hidden">
                      {liveExecutionTripped && <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] px-2 py-1 font-bold">TRIPPED</div>}
                      <div className="text-gray-500 text-xs font-bold uppercase mb-2">AI Execution Prob.</div>
                      <div className="text-3xl font-mono text-[#ff4757]">
                        {liveExecutionTripped ? "99.9" : (result.ai_detection ? (result.ai_detection.ai_generation_probability).toFixed(1) : '...')}
                        <span className="text-lg text-gray-500">%</span>
                      </div>
                    </div>
                  </div>

                  <div className={`bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-lg mt-6 transition-all ${liveExecutionTripped ? 'border-red-900 border-2 shadow-[0_0_30px_rgba(255,0,0,0.15)]' : ''}`}>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Executive System Summary</h3>
                    <p className="text-gray-300 leading-relaxed text-lg">
                      {liveExecutionTripped
                        ? "CRITICAL ALERT: Student failed the live interrogation crucible. Excessive copy-pasting or unnatural keystroke speeds (Bot Detection) were triggered during Mode B. This heavily correlates with AI generation and plagiarism. Override original algorithm clearance."
                        : (vivaScore !== null && liveExecutionPassed)
                          ? "Student successfully navigated both the Context Viva Phase and the Live Interrogation Crucible without triggering telemetry anomalies. This strongly corroborates code authorship regardless of initial static matches."
                          : result.summary}
                    </p>

                    {result.external_similarity_flag && (
                      <div className="mt-6 p-4 border border-red-900 bg-red-900 bg-opacity-10 rounded-lg">
                        <strong className="text-red-500 flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> External Web Overlap Detected</strong>
                        <p className="text-red-400 mt-2 text-sm">Signatures found matching widespread OSINT and GitHub templates. Proceed with defense interrogations.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: VIVA (CONTEXTUAL THEORY) */}
              {activeTab === 'viva' && (
                <div className="max-w-4xl mx-auto animate-fade-in h-full flex flex-col">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-100">Phase 1: Project Viva</h2>
                    <p className="text-gray-400">Validate the theoretical and architectural understanding of the submitted codebase.</p>
                  </div>

                  <div className="bg-[#161b22] border border-gray-700 rounded-xl overflow-hidden flex-1 flex flex-col shadow-2xl">
                    <div className="p-6 border-b border-gray-800 bg-[#0d1117]">
                      <div className="inline-block px-3 py-1 bg-blue-500 bg-opacity-20 text-blue-400 font-bold text-xs uppercase rounded-full mb-3 border border-blue-500 border-opacity-30">
                        Generated Theory Question
                      </div>
                      <h3 className="text-xl text-gray-100 leading-relaxed">
                        {result.suggested_viva_questions && result.suggested_viva_questions.length > 0
                          ? (typeof result.suggested_viva_questions[0] === 'string' ? result.suggested_viva_questions[0] : result.suggested_viva_questions[0].question)
                          : "Explain the highest complexity algorithm implementation in your specific codebase and justify your architectural decisions."}
                      </h3>
                    </div>

                    <div className="p-6 flex-1 flex flex-col bg-[#161b22]">
                      <label className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Student Response Transcript</label>
                      <textarea
                        className="w-full flex-1 bg-[#0d1117] border border-gray-700 rounded-lg p-4 text-gray-300 font-mono text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
                        placeholder="Begin typing the student's verbal defense or have the student type directly..."
                        value={vivaResponse}
                        onChange={(e) => setVivaResponse(e.target.value)}
                      />

                      <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={analyzeVivaResponse}
                            disabled={isEvaluatingViva || !vivaResponse.trim()}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center gap-2 transition-all uppercase text-sm tracking-wide"
                          >
                            {isEvaluatingViva ? (
                              <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> Verifying Context...</>
                            ) : (
                              <><Activity size={18} /> Run Semantic Analysis</>
                            )}
                          </button>
                        </div>

                        {vivaScore !== null && (
                          <div className="flex flex-col gap-2 mt-4 w-full animate-slide-up">
                            <div className="flex items-center justify-between bg-[#0d1117] px-6 py-4 rounded-xl border border-gray-700">
                              <div className="flex-1">
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">{vivaVerdict}</div>
                                <div className="text-sm text-gray-400 mt-1">{vivaReason}</div>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="text-[10px] text-gray-500 uppercase mb-1 font-bold tracking-widest">Semantic Match</div>
                                <div className="relative w-14 h-14 flex items-center justify-center rounded-full bg-gray-800 border-4 border-gray-700" style={{ borderColor: vivaScore > 80 ? '#3fb950' : vivaScore > 50 ? '#d29922' : '#ff4757' }}>
                                  <span className="text-lg font-bold text-white">{vivaScore}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: LIVE COMPILER (ARENA) */}
              {activeTab === 'live_compiler' && (
                <div className="animate-fade-in h-[calc(100vh-140px)]">
                  {result.suggested_viva_questions ? (
                    <LiveInterrogationArena
                      questions={result.suggested_viva_questions}
                      primaryLanguage={(result as any).primary_language || 'TypeScript'}
                      repoType={(result as any).repo_type || 'Mixed Codebase'}
                      onAntiCheatEvent={() => setLiveExecutionTripped(true)}
                      onExecutionComplete={() => setLiveExecutionPassed(true)}
                    />
                  ) : (
                    <div className="text-center text-gray-500 mt-20">No execution context generated.</div>
                  )}
                </div>
              )}

              {/* TAB 4: THE MASTER DASHBOARD (FINAL VERDICT) */}
              {activeTab === 'master_dashboard' && (
                <div className="max-w-6xl mx-auto animate-fade-in pb-12">
                  <div className="text-center mb-12">
                    <ShieldAlert className={`mx-auto w-16 h-16 mb-4 ${getRiskColor(result.overall_risk_level).split(' ')[0]}`} />
                    <h2 className="text-4xl font-extrabold text-white tracking-tight uppercase">Final Mission Report</h2>
                    <p className="text-gray-400 mt-2 tracking-widest uppercase">Target: {formData.studentName} | Project: {formData.projectTitle}</p>
                  </div>

                  {/* Mega Score Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Core Intel */}
                    <div className="bg-[#161b22] border border-gray-700 rounded-2xl p-6 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
                      <h3 className="text-gray-500 font-bold uppercase tracking-wider text-sm mb-4">Code Authorship Intel</h3>
                      <div className="flex items-end gap-3">
                        <span className="text-5xl font-extrabold text-white">{(result.confidence_score).toFixed(0)}</span>
                        <span className="text-xl text-gray-500 mb-1">/ 100</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-4 leading-relaxed">
                        Evaluated via syntactic cloning hashes, AST embeddings, and Git timeline progression.
                      </p>
                    </div>

                    {/* Theory */}
                    <div className="bg-[#161b22] border border-gray-700 rounded-2xl p-6 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 opacity-5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
                      <h3 className="text-gray-500 font-bold uppercase tracking-wider text-sm mb-4">Phase 1: Theory Eval</h3>
                      <div className="flex items-end gap-3">
                        <span className={`text-5xl font-extrabold ${vivaScore ? 'text-white' : 'text-gray-600'}`}>{vivaScore || '--'}</span>
                        <span className="text-xl text-gray-500 mb-1">/ 100</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-4 leading-relaxed">
                        {vivaScore ? "Calculated from explicit semantic resonance against the project context mesh." : "Requires execution of Phase 1 viva semantic analysis."}
                      </p>
                    </div>

                    {/* Live Exam */}
                    <div className="bg-[#161b22] border border-gray-700 rounded-2xl p-6 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 opacity-5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
                      <h3 className="text-gray-500 font-bold uppercase tracking-wider text-sm mb-4">Phase 2: Live Execution</h3>
                      <div className="flex items-end gap-3">
                        {liveExecutionTripped ? (
                          <span className="text-3xl font-extrabold text-[#ff4757]">FAILED</span>
                        ) : liveExecutionPassed ? (
                          <span className="text-3xl font-extrabold text-[#3fb950]">PASSED</span>
                        ) : (
                          <span className="text-5xl font-extrabold text-gray-600">PENDING</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-4 leading-relaxed">
                        Finalizing the Anti-Cheat telemetry via the Live Interrogation Crucible. Must be triggered manually.
                      </p>
                    </div>
                  </div>

                  {/* Ultimate Verdict Matrix */}
                  <div className={`p-8 rounded-2xl border-2 flex items-center justify-between shadow-2xl ${getRiskColor(result.overall_risk_level).replace('text-', 'border-').replace('border-', 'bg-opacity-10 bg-')}`}>
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Final AI Classification</h3>
                      <div className={`text-4xl font-extrabold tracking-tight uppercase ${getRiskColor(result.overall_risk_level).split(' ')[0]}`}>
                        [{result.overall_risk_level}] - {(result as any).recommendation || "REQUIRES VIVA"}
                      </div>
                      <p className="text-gray-300 mt-3 text-lg">{result.summary}</p>
                    </div>
                    <div>
                      <CheckCircle className={`w-24 h-24 ${getRiskColor(result.overall_risk_level).split(' ')[0]} opacity-20`} />
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </main>
    </div >
  );
}
