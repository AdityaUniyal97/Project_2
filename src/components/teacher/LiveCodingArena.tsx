import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Terminal, BrainCircuit, Activity, Clock, AlertTriangle } from "lucide-react";

interface Challenge {
    id: string;
    type: string;
    challenge_title: string;
    instructions: string;
    time_limit: number;
    starter_code: string;
}

export default function LiveCodingArena({ submissionId, riskScores }: { submissionId: string, riskScores: any }) {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [code, setCode] = useState("");
    const [timeLeft, setTimeLeft] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [results, setResults] = useState<any[]>([]);

    // Behavioral telemetry
    const [keystrokes, setKeystrokes] = useState(0);
    const [pastes, setPastes] = useState(0);
    const [tabSwitches, setTabSwitches] = useState(0);

    useEffect(() => {
        setIsLoading(true);
        fetch("http://localhost:8100/api/challenges/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                submission_id: submissionId,
                risk_scores: riskScores || {}
            })
        })
            .then(r => r.json())
            .then(data => {
                if (data.challenges && data.challenges.length > 0) {
                    setChallenges(data.challenges);
                    setCode(data.challenges[0].starter_code);
                    setTimeLeft(data.challenges[0].time_limit);
                }
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, [submissionId, riskScores]);

    useEffect(() => {
        if (isLoading || challenges.length === 0 || isEvaluating) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    submitCurrentChallenge();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isLoading, currentIdx, challenges, isEvaluating]);

    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden) setTabSwitches(prev => prev + 1);
        };
        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, []);

    const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCode(e.target.value);
        setKeystrokes(prev => prev + 1);
    };

    const handlePaste = () => {
        setPastes(prev => prev + 1);
    };

    const submitCurrentChallenge = () => {
        if (isEvaluating) return;
        setIsEvaluating(true);

        const current = challenges[currentIdx];

        const payload = {
            challenge: current,
            student_solution: code,
            behavioral_data: {
                time_taken: current.time_limit - timeLeft,
                keystrokes,
                paste_count: pastes,
                tab_switches: tabSwitches
            }
        };

        fetch("http://localhost:8100/api/challenges/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
            .then(r => r.json())
            .then(data => {
                if (data.evaluation) {
                    setResults(prev => [...prev, data.evaluation]);
                }

                // Reset telemetry and move to next or finish
                setKeystrokes(0);
                setPastes(0);
                setTabSwitches(0);

                if (currentIdx < challenges.length - 1) {
                    setCurrentIdx(prev => prev + 1);
                    setCode(challenges[currentIdx + 1].starter_code);
                    setTimeLeft(challenges[currentIdx + 1].time_limit);
                    setIsEvaluating(false);
                } else {
                    setIsEvaluating(false);
                }
            })
            .catch(err => {
                console.error(err);
                setIsEvaluating(false);
            });
    };

    const formatTime = (s: number) => {
        const min = Math.floor(s / 60);
        const sec = s % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 rounded-xl border border-white/60 bg-[#0B0F19] h-[500px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mb-4"></div>
                <p className="text-sm font-semibold text-emerald-400 animate-pulse">Generating Adaptive Coding Challenges...</p>
                <p className="text-xs text-slate-500 mt-2 text-center max-w-sm">Extracting functions from student's codebase to generate impossible-to-fake scenarios.</p>
            </div>
        );
    }

    if (results.length === challenges.length && challenges.length > 0) {
        // Show final summary mapping
        const overallScore = Math.round(results.reduce((acc, r) => acc + r.total_score, 0) / results.length);
        const hasFraud = results.some(r => r.verdict === 'FRAUD');
        const hasSuspicion = results.some(r => r.verdict === 'SUSPICIOUS');
        const finalVerdict = hasFraud ? 'FRAUD' : (hasSuspicion ? 'SUSPICIOUS' : 'AUTHENTIC');

        return (
            <div className="w-full bg-[#111726]/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-lg p-6 text-slate-200 min-h-[500px]">
                <h2 className="text-xl font-bold font-mono text-emerald-400 mb-4 uppercase flex items-center gap-2"><BrainCircuit /> Live Arena Results</h2>
                <div className="flex gap-4 mb-6">
                    <div className={`p-4 rounded-xl border border-white/10 flex-1 font-mono flex flex-col items-center justify-center shadow-inner ${finalVerdict === 'AUTHENTIC' ? 'bg-emerald-950/50 text-emerald-400' : 'bg-rose-950/50 text-rose-400'}`}>
                        <span className="text-xs uppercase text-slate-400 tracking-widest">Aggregate Score</span>
                        <span className="text-4xl font-bold mt-2">{overallScore}/100</span>
                    </div>
                    <div className={`p-4 rounded-xl border flex-1 font-mono flex flex-col items-center justify-center shadow-inner uppercase font-bold text-xl ${finalVerdict === 'AUTHENTIC' ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' : 'bg-rose-950/80 border-rose-500/50 text-rose-400'}`}>
                        {finalVerdict}
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase text-slate-500 tracking-wide border-b border-white/5 pb-2">Challenge Breaddown</h3>
                    {results.map((r, i) => (
                        <div key={i} className="bg-[#0b0f19] p-4 rounded-lg border border-white/5">
                            <div className="flex items-center justify-between font-mono mb-2">
                                <span className="text-emerald-400 font-bold">{challenges[i].challenge_title}</span>
                                <span className={`${r.verdict === 'AUTHENTIC' ? 'text-emerald-400' : 'text-rose-400'} font-bold`}>{r.total_score}/100</span>
                            </div>
                            <div className="text-xs font-mono text-slate-400 mb-2 italic">"{r.reasoning}"</div>
                            {r.behavioral_flags && r.behavioral_flags.length > 0 && (
                                <div className="text-rose-400 text-xs mt-2 border-t border-rose-900/40 pt-2 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> {r.behavioral_flags.join(", ")}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const current = challenges[currentIdx];
    if (!current) return null;

    return (
        <div className="w-full bg-[#111726]/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-lg p-6 text-slate-200 flex flex-col h-[650px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-3">
                    <Terminal className="w-6 h-6 text-emerald-400" />
                    <h2 className="text-lg font-bold font-mono text-white tracking-widest uppercase">Adaptive Challenge {currentIdx + 1}/{challenges.length}</h2>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="hidden sm:flex text-xs font-mono text-slate-500 gap-3 bg-[#05080f] px-3 py-1.5 rounded-md border border-white/5">
                        <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Key: {keystrokes}</span>
                        <span className="flex items-center gap-1 text-rose-400">Pst: {pastes}</span>
                        <span className="flex items-center gap-1 text-amber-400">Tab: {tabSwitches}</span>
                    </div>
                    <div className={`font-mono text-lg font-bold tracking-wider px-3 py-1 rounded-md border ${timeLeft < 120 ? 'text-rose-400 bg-rose-950 border-rose-900/50 animate-pulse' : 'text-emerald-400 bg-emerald-950 border-emerald-900/50'}`}>
                        <Clock className="w-4 h-4 inline mr-2" />{formatTime(timeLeft)}
                    </div>
                </div>
            </div>

            <div className="flex flex-1 gap-4 overflow-hidden">
                {/* Instructions Panel */}
                <div className="w-1/3 bg-slate-900/50 rounded-lg border border-slate-700/50 p-4 flex flex-col">
                    <span className="text-cyan-400 font-bold font-mono text-sm mb-2">{current.challenge_title}</span>
                    <div className="text-sm text-slate-300 font-sans whitespace-pre-wrap leading-relaxed flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {current.instructions}
                    </div>
                </div>

                {/* Editor Panel */}
                <div className="flex-1 flex flex-col rounded-lg border-2 border-slate-700/80 bg-[#05080f] overflow-hidden focus-within:border-emerald-500/50 transition-colors shadow-inner">
                    <div className="bg-[#111726] border-b border-white/5 px-4 py-2 text-xs font-mono text-slate-400 flex items-center justify-between">
                        <span>Live Coding Editor</span>
                        <span className="text-emerald-500/50">TypeScript</span>
                    </div>
                    <textarea
                        className="w-full flex-1 p-4 bg-transparent outline-none text-emerald-300/90 font-mono text-sm resize-none"
                        value={code}
                        onChange={handleCodeChange}
                        onPaste={handlePaste}
                        disabled={isEvaluating}
                        spellCheck={false}
                    />
                </div>
            </div>

            <div className="pt-4 mt-4 border-t border-white/5 flex justify-end">
                <button
                    onClick={submitCurrentChallenge}
                    disabled={isEvaluating || code.trim() === ""}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all font-mono text-sm disabled:opacity-50 flex items-center gap-2"
                >
                    {isEvaluating ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> : null}
                    {currentIdx < challenges.length - 1 ? 'Submit & Proceed' : 'Submit Final Challenge'}
                </button>
            </div>

        </div>
    );
}
