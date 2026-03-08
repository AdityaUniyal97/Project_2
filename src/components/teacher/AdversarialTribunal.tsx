import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle, ShieldAlert, Brain, Crosshair, HelpCircle, Code, Shield } from "lucide-react";
import SaboteurChallenge from "./SaboteurChallenge";

interface AgentQuestion {
    id: string;
    agent_id: string;
    agent_name: string;
    question: string;
    challenge_type: "text" | "code";
    buggy_code?: string;
    expected_fix?: string;
}

interface AgentVerdict {
    decision: "AUTHENTIC" | "SUSPICIOUS" | "FRAUD" | "ERROR" | "MANUAL_REVIEW";
    confidence: number;
    reasoning: string;
}

interface Props {
    submissionId: string;
    consciousnessData?: any;
}

export default function AdversarialTribunal({ submissionId, consciousnessData }: Props) {
    const [questions, setQuestions] = useState<AgentQuestion[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [verdicts, setVerdicts] = useState<Record<string, AgentVerdict>>({});
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [finalVerdict, setFinalVerdict] = useState<any>(null);

    useEffect(() => {
        // Generate questions when component mounts
        setIsLoading(true);
        let anomalies = [];
        if (consciousnessData?.timeline_events) {
            anomalies = consciousnessData.timeline_events.filter((e: any) => e.type === "anomaly");
        }

        fetch("http://localhost:8100/api/tribunal/generate-questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                submission_id: submissionId,
                consciousness_timeline: consciousnessData || {},
                anomalies: anomalies,
            })
        })
            .then(r => r.json())
            .then(data => {
                if (data.questions) {
                    setQuestions(data.questions);
                }
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, [submissionId, consciousnessData]);

    const evaluateAnswer = async (q: AgentQuestion) => {
        const answer = answers[q.id];
        if (!answer) return;

        setLoadingStates(prev => ({ ...prev, [q.id]: true }));
        try {
            const res = await fetch("http://localhost:8100/api/tribunal/evaluate-answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    agent_id: q.agent_id,
                    question: q.question,
                    student_answer: answer,
                    code_context: q.buggy_code || ""
                })
            });
            const data = await res.json();
            if (data.verdict) {
                setVerdicts(prev => ({ ...prev, [q.id]: data.verdict }));
            }
        } catch (e) {
            console.error(e);
            setVerdicts(prev => ({ ...prev, [q.id]: { decision: "ERROR", confidence: 0, reasoning: String(e) } }));
        }
        setLoadingStates(prev => ({ ...prev, [q.id]: false }));
    };

    const getFinalVerdict = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("http://localhost:8100/api/tribunal/final-verdict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    submission_id: submissionId,
                    all_agent_verdicts: Object.values(verdicts)
                })
            });
            const data = await res.json();
            if (data.final_verdict) {
                setFinalVerdict(data.final_verdict);
            }
        } catch (e) {
            console.error(e);
        }
        setIsLoading(false);
    };

    const isAllAnswered = questions.length > 0 && questions.every(q => verdicts[q.id]);

    const getAgentIcon = (id: string) => {
        if (id === "ARCHITECT") return <Brain className="w-5 h-5 text-indigo-400" />;
        if (id === "SURGEON") return <Crosshair className="w-5 h-5 text-rose-400" />;
        if (id === "HISTORIAN") return <HelpCircle className="w-5 h-5 text-amber-400" />;
        if (id === "DETECTIVE") return <ShieldAlert className="w-5 h-5 text-cyan-400" />;
        if (id === "SABOTEUR") return <Code className="w-5 h-5 text-emerald-400" />;
        return <Shield className="w-5 h-5 text-white" />;
    };

    const getVerdictBadge = (decision: string) => {
        if (decision === "AUTHENTIC" || decision === "VERIFIED") return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-2 py-0.5 rounded text-xs font-bold font-mono">✅ {decision}</span>;
        if (decision === "FRAUD") return <span className="bg-red-500/20 text-red-400 border border-red-500/50 px-2 py-0.5 rounded text-xs font-bold font-mono">❌ FRAUD</span>;
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/50 px-2 py-0.5 rounded text-xs font-bold font-mono">⚠️ {decision}</span>;
    };

    return (
        <div className="w-full flex flex-col gap-6 text-slate-200">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <ShieldAlert className="w-8 h-8 text-red-500" />
                <div>
                    <h2 className="text-xl font-bold font-mono text-white tracking-widest uppercase">Adversarial Tribunal Chamber</h2>
                    <p className="text-xs text-slate-400 mt-1">Multi-Agent Interrogation Protocol Activated</p>
                </div>
            </div>

            {isLoading && questions.length === 0 && (
                <div className="flex justify-center p-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
                </div>
            )}

            <div className="flex flex-col gap-4">
                {questions.map((q, idx) => {
                    const v = verdicts[q.id];
                    const isEval = loadingStates[q.id];

                    if (q.agent_id === "SABOTEUR") {
                        return <SaboteurChallenge key={q.id} submissionId={submissionId} onComplete={(v) => setVerdicts(prev => ({ ...prev, [q.id]: v }))} />;
                    }

                    return (
                        <div key={q.id} className="bg-[#111726]/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-lg p-5">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                                {getAgentIcon(q.agent_id)}
                                <h3 className="text-sm font-bold text-white font-mono tracking-wide">{q.agent_name}</h3>
                                {v && <div className="ml-auto">{getVerdictBadge(v.decision)}</div>}
                            </div>

                            <div className="mb-4">
                                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Question / Challenge:</span>
                                <p className="text-sm text-slate-300 mt-1">{q.question}</p>
                                {q.challenge_type === "code" && q.buggy_code && (
                                    <pre className="mt-2 text-xs bg-[#0b0f19] text-blue-300 p-3 rounded-md overflow-x-auto border border-white/5">
                                        {q.buggy_code}
                                    </pre>
                                )}
                            </div>

                            {!v && !isEval && (
                                <div className="flex flex-col gap-3">
                                    <textarea
                                        className="w-full bg-[#0b0f19] border border-white/10 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-red-500/50 resize-none h-24 font-mono transition-colors"
                                        placeholder="Student Response..."
                                        value={answers[q.id] || ""}
                                        onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => evaluateAnswer(q)}
                                            disabled={!answers[q.id]}
                                            className="bg-red-900/40 hover:bg-red-800/60 text-red-200 border border-red-500/30 px-4 py-2 rounded text-xs font-bold disabled:opacity-50 transition-colors"
                                        >
                                            Submit & Evaluate
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isEval && (
                                <div className="flex items-center gap-3 text-sm text-slate-400 bg-[#0b0f19] p-3 rounded-lg border border-white/5">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                                    <span>Agent Evaluating Response...</span>
                                </div>
                            )}

                            {v && (
                                <AnimatePresence>
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-[#0b0f19] p-3 rounded-lg border border-white/5 mt-3">
                                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">Agent Reasoning:</span>
                                        <p className="text-sm text-slate-300 italic">"{v.reasoning}"</p>
                                        <div className="mt-2 text-xs text-slate-500">Confidence Score: <span className="text-slate-300 font-mono">{(v.confidence * 100).toFixed(0)}%</span></div>
                                    </motion.div>
                                </AnimatePresence>
                            )}
                        </div>
                    );
                })}
            </div>

            {isAllAnswered && !finalVerdict && (
                <div className="flex justify-center mt-4 border-t border-white/10 pt-6">
                    <button
                        onClick={getFinalVerdict}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all flex items-center gap-2"
                    >
                        {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Brain className="w-5 h-5" />}
                        Compute Final Tribunal Consensus
                    </button>
                </div>
            )}

            {finalVerdict && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 bg-[#151b2b] rounded-2xl border-2 border-slate-700 p-6 flex flex-col gap-4 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1 h-full ${finalVerdict.verdict === 'AUTHENTIC' || finalVerdict.verdict === 'VERIFIED' ? 'bg-emerald-500' : (finalVerdict.verdict === 'FRAUD' ? 'bg-red-500' : 'bg-amber-500')}`}></div>
                    <h3 className="text-lg font-bold uppercase tracking-widest text-slate-400 border-b border-white/5 pb-2">Final Tribunal Verdict</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block mb-1">Status</span>
                            <div className="text-2xl">{getVerdictBadge(finalVerdict.verdict)}</div>
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block mb-1">Overall Confidence</span>
                            <div className="text-2xl font-bold font-mono text-white">{(finalVerdict.confidence * 100).toFixed(0)}%</div>
                        </div>
                    </div>

                    <div className="bg-[#0b0f19] p-4 rounded-xl border border-white/5 mt-2">
                        <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block mb-2">Consensus Reasoning</span>
                        <p className="text-sm text-slate-300 leading-relaxed">{finalVerdict.reasoning}</p>
                    </div>
                </motion.div>
            )}

        </div>
    );
}
