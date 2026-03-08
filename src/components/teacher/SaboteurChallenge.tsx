import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code, Clock, ShieldAlert } from "lucide-react";

interface SaboteurScore {
    bug_identification_score: number;
    location_accuracy_score: number;
    explanation_quality_score: number;
    fix_correctness_score: number;
    total_score: number;
    verdict: "AUTHENTIC" | "SUSPICIOUS" | "FRAUD" | "ERROR";
    reasoning: string;
    red_flags: string[];
}

export default function SaboteurChallenge({ submissionId, onComplete }: { submissionId: string; onComplete?: (verdict: any) => void }) {
    const [challenge, setChallenge] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(900);
    const [bugType, setBugType] = useState("");
    const [explanation, setExplanation] = useState("");
    const [fixedCode, setFixedCode] = useState("");
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [evaluation, setEvaluation] = useState<SaboteurScore | null>(null);
    const [hint, setHint] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);
        fetch("http://localhost:8100/api/saboteur/generate-challenge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ submission_id: submissionId })
        })
            .then(r => r.json())
            .then(d => {
                if (d.challenge) {
                    setChallenge(d.challenge);
                    setTimeLeft(d.challenge.time_limit || 900);
                    setFixedCode(d.challenge.buggy_code || "");
                }
                setIsLoading(false);
            })
            .catch(e => {
                console.error(e);
                setIsLoading(false);
            });
    }, [submissionId]);

    useEffect(() => {
        if (!challenge || evaluation) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [challenge, evaluation]);

    const requestHint = () => {
        if (!challenge) return;
        fetch("http://localhost:8100/api/saboteur/request-hint", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ challenge_id: challenge.challenge_id })
        })
            .then(r => r.json())
            .then(d => {
                if (d.hint) setHint(d.hint);
            })
            .catch(console.error);
    };

    const submitFix = () => {
        if (!challenge) return;
        setIsEvaluating(true);
        fetch("http://localhost:8100/api/saboteur/submit-fix", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                challenge_id: challenge.challenge_id,
                student_fix: fixedCode,
                explanation,
                bug_type: bugType,
                expected_fix: challenge.expected_fix,
                time_taken: (challenge.time_limit || 900) - timeLeft
            })
        })
            .then(r => r.json())
            .then(d => {
                if (d.evaluation) {
                    setEvaluation(d.evaluation);
                    if (onComplete) {
                        onComplete({
                            decision: d.evaluation.verdict,
                            confidence: d.evaluation.total_score / 100,
                            reasoning: d.evaluation.reasoning
                        });
                    }
                }
                setIsEvaluating(false);
            })
            .catch(e => {
                console.error(e);
                setIsEvaluating(false);
            });
    };

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-8 text-neutral-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
                <span className="ml-3 mt-1 font-mono">Simulating Synthetic Bug...</span>
            </div>
        );
    }

    if (!challenge) return null;

    return (
        <div className="w-full bg-[#111726]/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-lg p-5 text-slate-200 mt-6 relative z-10">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
                <Code className="w-6 h-6 text-emerald-400" />
                <h3 className="text-md font-bold text-white font-mono tracking-wide">AGENT 5: THE SABOTEUR</h3>

                <div className="ml-auto flex flex-col items-end">
                    <div className={`flex items-center gap-2 font-mono font-bold px-3 py-1 rounded-md border ${timeLeft < 300 ? 'text-rose-400 bg-rose-950/30 border-rose-900/50' : 'text-amber-400 bg-amber-950/30 border-amber-900/50'}`}>
                        <Clock className="w-4 h-4" />
                        {formatTime(timeLeft)}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldAlert className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-bold text-slate-300">Targeting Architecture Flaw in: <span className="text-emerald-300 font-mono text-xs bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40">{challenge.file}</span></span>
                    </div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-2 pt-2">Original Code (READ ONLY)</span>
                    <pre className="text-xs bg-[#05080f] text-indigo-300/80 p-4 rounded-md overflow-x-auto border border-indigo-900/30 font-mono select-none shadow-inner">
                        {challenge.buggy_code}
                    </pre>
                </div>

                <div className="space-y-4 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                    <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest border-b border-emerald-900/50 pb-2 flex w-full">Mission: Debug your code</span>

                    <div className="pt-2">
                        <label className="text-xs text-slate-400 font-bold uppercase block mb-2">1. Identify Bug Type</label>
                        <input
                            type="text"
                            className="w-full bg-[#0b0f19] border border-white/10 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 font-mono transition-colors shadow-inner"
                            placeholder="e.g. MEMORY_LEAK, STALE_CLOSURE"
                            value={bugType}
                            onChange={e => setBugType(e.target.value)}
                            disabled={!!evaluation || isEvaluating}
                        />
                    </div>

                    <div>
                        <label className="text-xs text-slate-400 font-bold uppercase block mb-2">2. Explain WHAT is wrong and WHY</label>
                        <textarea
                            className="w-full h-24 bg-[#0b0f19] border border-white/10 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 font-mono resize-none transition-colors shadow-inner"
                            placeholder="Explain the root cause..."
                            value={explanation}
                            onChange={e => setExplanation(e.target.value)}
                            disabled={!!evaluation || isEvaluating}
                        />
                    </div>

                    <div>
                        <label className="text-xs text-slate-400 font-bold uppercase block mb-2">3. Provide Corrected Code snippet</label>
                        <textarea
                            className="w-full h-40 bg-[#05080f] border-2 border-emerald-900/60 rounded-lg p-4 text-sm text-emerald-400/90 focus:outline-none focus:border-emerald-400/80 font-mono resize-y shadow-inner transition-colors"
                            spellCheck={false}
                            value={fixedCode}
                            onChange={e => setFixedCode(e.target.value)}
                            disabled={!!evaluation || isEvaluating}
                        />
                    </div>
                </div>

                {hint && (
                    <div className="bg-amber-950/40 text-amber-200 border border-amber-900/50 p-4 rounded-lg text-sm font-mono shadow-inner">
                        <strong className="text-amber-400">Hint (-10 pts):</strong> {hint}
                    </div>
                )}

                {!evaluation && !isEvaluating && (
                    <div className="flex justify-between items-center mt-2 pt-2">
                        <button
                            onClick={requestHint}
                            disabled={!!hint}
                            className="text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors disabled:opacity-30 border border-slate-700/50 bg-slate-800/50 px-3 py-1.5 rounded-md"
                        >
                            Request Hint (-10pts)
                        </button>
                        <button
                            onClick={submitFix}
                            disabled={!bugType || !explanation || !fixedCode}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all font-mono text-sm disabled:opacity-50 disabled:shadow-none disabled:hover:bg-emerald-600"
                        >
                            Submit Fix Analysis
                        </button>
                    </div>
                )}

                {isEvaluating && (
                    <div className="flex justify-center items-center p-6 border border-emerald-900/30 rounded-lg bg-emerald-950/10 mt-2 gap-3 text-emerald-400">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400"></div>
                        <span className="font-mono text-sm font-bold tracking-wider">Compiling and Verifying Fix Protocol...</span>
                    </div>
                )}

                {evaluation && (
                    <AnimatePresence>
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mt-4 border-t border-white/10 pt-6">
                            <div className="flex flex-col gap-4">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Saboteur Final Verdict</h4>
                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold font-mono shadow-lg border
                     ${evaluation.verdict === 'AUTHENTIC' ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50' :
                                            evaluation.verdict === 'FRAUD' || evaluation.verdict === 'ERROR' ? 'bg-rose-950/80 text-rose-400 border-rose-500/50' :
                                                'bg-amber-950/80 text-amber-400 border-amber-500/50'}`}>
                                        {evaluation.verdict} <span className="opacity-50">|</span> SCORE: {evaluation.total_score}/100
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono font-bold">
                                    <div className="bg-[#0b0f19] p-3 rounded-lg border border-white/5 flex flex-col gap-1 justify-between shadow-inner">
                                        <span className="text-slate-500">Bug Identified</span>
                                        <span className={`text-xl ${evaluation.bug_identification_score >= 20 ? 'text-emerald-400' : 'text-rose-400'}`}>{evaluation.bug_identification_score}/25</span>
                                    </div>
                                    <div className="bg-[#0b0f19] p-3 rounded-lg border border-white/5 flex flex-col gap-1 justify-between shadow-inner">
                                        <span className="text-slate-500">Location Accuracy</span>
                                        <span className={`text-xl ${evaluation.location_accuracy_score >= 20 ? 'text-emerald-400' : 'text-rose-400'}`}>{evaluation.location_accuracy_score}/25</span>
                                    </div>
                                    <div className="bg-[#0b0f19] p-3 rounded-lg border border-white/5 flex flex-col gap-1 justify-between shadow-inner">
                                        <span className="text-slate-500">Explanation Depth</span>
                                        <span className={`text-xl ${evaluation.explanation_quality_score >= 20 ? 'text-emerald-400' : 'text-rose-400'}`}>{evaluation.explanation_quality_score}/25</span>
                                    </div>
                                    <div className="bg-[#0b0f19] p-3 rounded-lg border border-white/5 flex flex-col gap-1 justify-between shadow-inner">
                                        <span className="text-slate-500">Fix Technicality</span>
                                        <span className={`text-xl ${evaluation.fix_correctness_score >= 20 ? 'text-emerald-400' : 'text-rose-400'}`}>{evaluation.fix_correctness_score}/25</span>
                                    </div>
                                </div>

                                <div className="bg-[#151b2b] p-4 rounded-xl border border-white/10 shadow-lg mt-2">
                                    <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block mb-2">Agent Reasonings</span>
                                    <p className="text-sm text-slate-300 leading-relaxed font-serif italic border-l-2 border-emerald-900 pl-3">"{evaluation.reasoning}"</p>
                                    {evaluation.red_flags && evaluation.red_flags.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-rose-900/30">
                                            <span className="text-xs text-rose-500 font-bold uppercase tracking-wider block mb-2 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Critical Flaws Detected:</span>
                                            <ul className="list-disc pl-5 text-sm text-rose-300/80 space-y-1">
                                                {evaluation.red_flags.map((rl: string, i: number) => <li key={i}>{rl}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
