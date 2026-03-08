import React, { useState, useEffect } from 'react';
import './ProofOfWorkTerminal.css';

// TypeScript interfaces for the new object structure
interface VivaQuestion {
    question: string;
    category?: string;
    difficulty?: string;
    why_this_tests_authorship?: string;
}

interface ProofOfWorkTerminalProps {
    questions: (VivaQuestion | string)[];
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, errorInfo: string }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, errorInfo: '' };
    }

    static getDerivedStateFromError(_: any) {
        return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
        this.setState({ errorInfo: String(error) });
        console.error("ProofOfWorkTerminal Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="terminal-error-boundary">
                    <h3>Terminal Error Component Render Failed</h3>
                    <p>Please check the console. The system received malformed intelligence data.</p>
                </div>
            );
        }
        return this.props.children;
    }
}

const InterrogationCard = ({ qData, index }: { qData: VivaQuestion, index: number }) => {
    const [isAccordionOpen, setIsAccordionOpen] = useState(false);
    const [defenseModeActive, setDefenseModeActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes

    useEffect(() => {
        let timer: any;
        if (defenseModeActive && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && defenseModeActive) {
            setDefenseModeActive(false);
        }
        return () => clearInterval(timer);
    }, [defenseModeActive, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const difficultyClass =
        qData.difficulty?.toLowerCase() === 'hard' ? 'badge-hard' :
            qData.difficulty?.toLowerCase() === 'medium' ? 'badge-medium' :
                'badge-easy';

    return (
        <div className={`interrogation-card ${defenseModeActive ? 'defense-active' : ''}`}>
            <div className="card-header">
                <span className="challenge-id">CHALLENGE_{index + 1}</span>
                <div className="badges">
                    {qData.category && <span className="cat-badge">{qData.category.toUpperCase()}</span>}
                    {qData.difficulty && <span className={`diff-badge ${difficultyClass}`}>{qData.difficulty.toUpperCase()}</span>}
                </div>
            </div>

            <div className="mock-ide">
                <div className="ide-header">
                    <span className="dot dot-red"></span>
                    <span className="dot dot-yellow"></span>
                    <span className="dot dot-green"></span>
                    <span className="ide-filename">defense_protocol.ts</span>
                </div>
                <div className="ide-body">
                    <pre><code><span className="code-keyword">async function</span> <span className="code-func">verifyAuthorship</span>() {'{\n'}  <span className="code-comment">// The system requires you to answer:</span>
                        <span className="code-string">"{qData.question}"</span>
                        {'}\n'}</code></pre>
                </div>
            </div>

            {qData.why_this_tests_authorship && (
                <div className="admin-insights">
                    <button
                        className="accordion-toggle"
                        onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                    >
                        <span>👁 System Heuristics (Admin Only)</span>
                        <span>{isAccordionOpen ? '▲' : '▼'}</span>
                    </button>

                    {isAccordionOpen && (
                        <div className="accordion-content">
                            <p>{qData.why_this_tests_authorship}</p>
                        </div>
                    )}
                </div>
            )}

            <div className="defense-controls">
                {!defenseModeActive ? (
                    <button
                        className="start-interrogation-btn"
                        onClick={() => setDefenseModeActive(true)}
                    >
                        Start Interrogation ⚡
                    </button>
                ) : (
                    <div className="active-defense-hud">
                        <div className="timer-display">
                            <span className="timer-pulse"></span>
                            TIME REMAINING: <span className={`time ${timeLeft < 300 ? 'time-critical' : ''}`}>{formatTime(timeLeft)}</span>
                        </div>
                        <button className="end-interrogation-btn" onClick={() => setDefenseModeActive(false)}>
                            Conclude Defense
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export const ProofOfWorkTerminal = ({ questions }: ProofOfWorkTerminalProps) => {
    if (!questions || questions.length === 0) return null;

    return (
        <ErrorBoundary>
            <div className="proof-of-work-terminal">
                <div className="terminal-header">
                    <h3>Proof-of-Work Interrogation Terminal</h3>
                    <p>Initialize live defense parameters. Authentication required.</p>
                </div>

                <div className="arena-ui">
                    {questions.map((q, idx) => {
                        // Support both old string format and new object format gracefully
                        const qData: VivaQuestion = typeof q === 'string'
                            ? { question: q, difficulty: 'Medium', category: 'General' }
                            : q;

                        return <InterrogationCard key={idx} qData={qData} index={idx} />;
                    })}
                </div>
            </div>
        </ErrorBoundary>
    );
};

export const TerminalSkeleton = () => {
    return (
        <div className="proof-of-work-terminal skeleton-mode">
            <div className="skeleton-header pulse"></div>
            <div className="arena-ui">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="interrogation-card skeleton-card pulse">
                        <div className="skeleton-ide"></div>
                        <div className="skeleton-btn"></div>
                    </div>
                ))}
            </div>
        </div>
    );
};
