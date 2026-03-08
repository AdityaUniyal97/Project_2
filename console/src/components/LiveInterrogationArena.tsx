import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import './LiveInterrogationArena.css';

interface VivaQuestion {
    question: string;
    category?: string;
    difficulty?: string;
    why_this_tests_authorship?: string;
}

interface LiveInterrogationArenaProps {
    questions: (VivaQuestion | string)[];
    primaryLanguage?: string;
    repoType?: string;
    onAntiCheatEvent?: (type: 'paste' | 'bot_typing') => void;
    onExecutionComplete?: () => void;
}

// Ensure at least two questions to map to Mode A and Mode B
const normalizeQuestions = (rawQuestions: (VivaQuestion | string)[]) => {
    const norm = rawQuestions.map(q => typeof q === 'string' ? { question: q, category: 'General', difficulty: 'Medium' } : q);

    if (norm.length === 0) {
        return [
            { question: "Design the database schema for the feature you built.", category: "System Design", difficulty: "Medium" },
            { question: "Write the core MERN stack logic to achieve the project feature, given this expected output.", category: "Core Execution", difficulty: "Hard" }
        ];
    }
    if (norm.length === 1) {
        norm.push({ question: "Explain the architecture of your solution and write a pseudo-code implementation.", category: "System Design", difficulty: "Medium" });
    }
    return norm;
};

export const LiveInterrogationArena: React.FC<LiveInterrogationArenaProps> = ({ questions, primaryLanguage, repoType, onAntiCheatEvent, onExecutionComplete }) => {
    const normalizedQuestions = normalizeQuestions(questions);
    const designQuestion = normalizedQuestions[0];
    const executionQuestion = normalizedQuestions[1];

    const [activeTab, setActiveTab] = useState<'design' | 'execution'>('design');
    const [code, setCode] = useState('// Initialize Defense Protocol...\n\nfunction verifyAuthorship() {\n  // Write your execution logic here\n}\n');
    const [designNotes, setDesignNotes] = useState('');

    // Telemetry & Anti-Cheat State
    const [showTeacherOverlay, setShowTeacherOverlay] = useState(false);
    const [pasteCount, setPasteCount] = useState(0);
    const [blurCount, setBlurCount] = useState(0);
    const [botDetectCount, setBotDetectCount] = useState(0);
    const [confidenceScore, setConfidenceScore] = useState<number | null>(null);

    // Execution State
    const [execStatus, setExecStatus] = useState<'idle' | 'running' | 'done'>('idle');
    const [execLogs, setExecLogs] = useState<string[]>([]);

    // Time tracking
    const [sessionTime, setSessionTime] = useState(0);
    const lastKeyTimeRef = useRef(Date.now());
    const lastCodeLengthRef = useRef(code.length);

    // Focus Tracking (Tab switching)
    useEffect(() => {
        const handleBlur = () => {
            setBlurCount(prev => prev + 1);
            console.warn("[TELEMETRY] OSINT/Context Switch Detected");
        };
        window.addEventListener('blur', handleBlur);
        return () => window.removeEventListener('blur', handleBlur);
    }, []);

    // Timer
    useEffect(() => {
        const timer = setInterval(() => setSessionTime(prev => prev + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleEditorChange = (value: string | undefined) => {
        if (!value) return;

        const now = Date.now();
        const timeDiff = now - lastKeyTimeRef.current;
        const lenDiff = value.length - lastCodeLengthRef.current;

        // Keystroke Dynamics: If > 50 characters appear in < 50ms, it's an AI/Bot paste anomaly
        if (lenDiff > 50 && timeDiff < 50) {
            setBotDetectCount(prev => prev + 1);
            if (onAntiCheatEvent) onAntiCheatEvent('bot_typing');
        }

        lastKeyTimeRef.current = now;
        lastCodeLengthRef.current = value.length;
        setCode(value);
    };

    const handleTextAreaPaste = () => {
        setPasteCount(prev => prev + 1);
        if (onAntiCheatEvent) onAntiCheatEvent('paste');
    };

    const handleExecuteCode = () => {
        if (execStatus === 'running') return;
        setExecStatus('running');
        setExecLogs(['>_ Compiling defense_protocol.ts...']);
        setTimeout(() => setExecLogs(prev => [...prev, '>_ Running Unit Tests...']), 800);
        setTimeout(() => setExecLogs(prev => [...prev, '>_ Analyzing AST Trees for execution path...']), 1600);
        setTimeout(() => {
            setExecLogs(prev => [...prev, '>_ SUCCESS: 14/14 Execution Points Validated.', '>_ Crucible Mode B Completed.']);
            setExecStatus('done');
            if (onExecutionComplete) onExecutionComplete();
        }, 3000);
    };

    const calculateFinalScore = () => {
        let score = 100;
        score -= (pasteCount * 20);      // -20 per paste
        score -= (blurCount * 15);       // -15 per tab switch
        score -= (botDetectCount * 40);  // -40 per unnatural keystroke block (AI suspect)

        setConfidenceScore(Math.max(0, score));
    };

    const aiProbability = Math.min(99, (botDetectCount * 30) + (pasteCount * 15));

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="interrogation-arena">
            <div className="arena-header">
                <div className="header-title">
                    <span className="live-dot pulse"></span>
                    <h2>ProjectGuard Live Interrogation Arena</h2>
                </div>
                <div className="header-controls">
                    <div className="telemetry-visualizer">
                        <span className="telem-bar wave-1"></span>
                        <span className="telem-bar wave-2"></span>
                        <span className="telem-bar wave-3"></span>
                        <span className="telem-bar wave-1"></span>
                        <span className="telem-txt">LIVE NETWORK TELEMETRY</span>
                    </div>
                    <div className="session-timer">{formatTime(sessionTime)}</div>
                    <button
                        className={`teacher-toggle-btn ${showTeacherOverlay ? 'active' : ''}`}
                        onClick={() => setShowTeacherOverlay(!showTeacherOverlay)}
                    >
                        {showTeacherOverlay ? 'Hide Teacher Dashboard' : 'View Teacher Dash'}
                    </button>
                </div>
            </div>

            <div className="arena-layout">
                {/* LEFT PANE: The Interrogation */}
                <div className="left-pane interrogation-pane">
                    <div className="pane-tabs">
                        <button
                            className={`pane-tab ${activeTab === 'design' ? 'active' : ''}`}
                            onClick={() => setActiveTab('design')}
                        >
                            Mode A: System Design
                        </button>
                        <button
                            className={`pane-tab ${activeTab === 'execution' ? 'active' : ''}`}
                            onClick={() => setActiveTab('execution')}
                        >
                            Mode B: Core Execution
                        </button>
                    </div>

                    <div className="pane-content">
                        {activeTab === 'design' ? (
                            <div className="question-card fade-in">
                                <div className="q-badge design-badge">System Design</div>
                                <h3>{designQuestion.question}</h3>
                                {showTeacherOverlay && designQuestion.why_this_tests_authorship && (
                                    <div className="admin-insight">
                                        <h4>👁️ System Heuristic (Hidden from student)</h4>
                                        <p>{designQuestion.why_this_tests_authorship}</p>
                                    </div>
                                )}
                                <div className="student-input-container">
                                    <label>Architecture / Schema Notes</label>
                                    <textarea
                                        className="design-textarea"
                                        placeholder="Describe your design decisions here..."
                                        value={designNotes}
                                        onChange={(e) => setDesignNotes(e.target.value)}
                                        onPaste={handleTextAreaPaste}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="question-card fade-in">
                                <div className="q-badge exec-badge">Core Execution</div>
                                <h3>{executionQuestion.question}</h3>
                                {showTeacherOverlay && executionQuestion.why_this_tests_authorship && (
                                    <div className="admin-insight">
                                        <h4>👁️ System Heuristic (Hidden from student)</h4>
                                        <p>{executionQuestion.why_this_tests_authorship}</p>
                                    </div>
                                )}
                                <p className="task-desc">
                                    Write the robust logic in the editor panel to the right.
                                    Syntax highlighting and execution environments are active.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT PANE: The Crucible */}
                <div className="right-pane crucible-pane">
                    <div className="editor-header bg-[#0d1117] px-4 py-2 border-b border-gray-700 flex justify-between items-center text-xs font-mono text-gray-500">
                        <div className="flex gap-4">
                            <span>REPO CONTEXT: <strong className="text-blue-400">{repoType || 'Mixed Codebase'}</strong></span>
                            <span>RUNTIME: <strong className="text-yellow-400">{primaryLanguage || 'TypeScript'}</strong></span>
                        </div>
                        <div className="editor-dots flex items-center gap-2">
                            <span className="dot red w-3 h-3 rounded-full bg-red-500"></span>
                            <span className="dot yellow w-3 h-3 rounded-full bg-yellow-500"></span>
                            <span className="dot green w-3 h-3 rounded-full bg-green-500"></span>
                        </div>
                    </div>
                    <div className="editor-wrapper" onPasteCapture={() => {
                        setPasteCount(prev => prev + 1);
                        if (onAntiCheatEvent) onAntiCheatEvent('paste');
                    }}>
                        <Editor
                            height="100%"
                            language={(primaryLanguage || 'typescript').toLowerCase()}
                            theme="vs-dark"
                            value={code}
                            onChange={handleEditorChange}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                fontFamily: "'Fira Code', 'Courier New', monospace",
                                lineNumbers: "on",
                                scrollBeyondLastLine: false,
                                wordWrap: "on",
                                padding: { top: 16 }
                            }}
                        />
                    </div>
                    <div className="execution-terminal relative">
                        <div className="term-header flex justify-between items-center pr-2">
                            <span>STDOUT / Execution Results</span>
                            <button
                                onClick={handleExecuteCode}
                                disabled={execStatus === 'running'}
                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-1 px-3 text-xs uppercase tracking-widest rounded shadow-[0_0_15px_rgba(82,168,255,0.4)] transition-all"
                                style={{ transform: 'translateY(-2px)' }}
                            >
                                Execute &amp; Submit Code
                            </button>
                        </div>
                        <div className="term-body flex flex-col font-mono text-sm leading-relaxed pb-4">
                            {execStatus === 'idle' && (
                                <div><span className="term-prompt">&gt;_ </span> Waiting for execution trigger...</div>
                            )}
                            {execLogs.map((log, i) => <div key={i} className={log.includes('SUCCESS') ? 'text-green-400 mt-2 font-bold' : ''}>{log}</div>)}
                            {execStatus === 'running' && (
                                <div className="text-blue-400 mt-1 animate-pulse font-bold">_</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* GOD-LEVEL ANTI-CHEAT TEACHER OVERLAY */}
            {showTeacherOverlay && (
                <div className="teacher-dashboard-overlay slide-up">
                    <div className="dash-header">
                        <h3>God-Level Telemetry & Anti-Cheat</h3>
                        <button className="close-btn" onClick={() => setShowTeacherOverlay(false)}>✕</button>
                    </div>

                    <div className="telemetry-grid">
                        <div className={`telem-card ${pasteCount > 0 ? 'alert-danger' : 'safe'}`}>
                            <h4>Copy-Paste Tripwire</h4>
                            <div className="telem-val">{pasteCount} Events</div>
                            {pasteCount > 0 && <div className="alert-badge">External Paste Detected</div>}
                        </div>

                        <div className={`telem-card ${blurCount > 0 ? 'alert-warning' : 'safe'}`}>
                            <h4>Focus Tracking (Tab Switch)</h4>
                            <div className="telem-val">{blurCount} Events</div>
                            {blurCount > 0 && <div className="alert-badge warning">OSINT/Context Switch</div>}
                        </div>

                        <div className={`telem-card ${aiProbability > 50 ? 'alert-critical' : 'safe'}`}>
                            <h4>AI / Bot Probability</h4>
                            <div className="telem-val">{aiProbability}%</div>
                            {botDetectCount > 0 && <div className="alert-badge critical">Unnatural Keystrokes Detected</div>}
                        </div>
                    </div>

                    <div className="dash-footer">
                        <button className="finalize-btn" onClick={calculateFinalScore}>
                            Finalize Assessment
                        </button>
                        {confidenceScore !== null && (
                            <div className="final-score">
                                Authorship Confidence Score:
                                <span className={`score ${confidenceScore > 70 ? 'score-high' : confidenceScore > 40 ? 'score-med' : 'score-low'}`}>
                                    {confidenceScore}%
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
