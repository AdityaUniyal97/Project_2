import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

interface TestCase {
    input: any;
    expected_output: any;
    description?: string;
}

interface TestResult {
    test_num: number;
    passed: boolean;
    input: any;
    expected: any;
    actual: any;
    error: string | null;
}

interface ExecutionResult {
    success: boolean;
    passed_tests: number;
    total_tests: number;
    execution_time_ms: number;
    test_results: TestResult[];
    errors: string | null;
    verdict: 'PASS' | 'FAIL' | 'ERROR';
}

export interface ChallengeData {
    challenge_id?: string;
    original_code: string;
    filename: string;
    function_name: string;
    challenge_description: string;
    requirements: string[];
    test_cases: TestCase[];
    starter_code: string;
    hints?: string[];
    time_limit_minutes: number;
    language: string;
}

interface LiveCodingChallengeProps {
    challenge: ChallengeData;
    onComplete?: (result: ExecutionResult) => void;
}

const LiveCodingChallenge: React.FC<LiveCodingChallengeProps> = ({
    challenge,
    onComplete
}) => {
    const [code, setCode] = useState(challenge.starter_code || '');
    const [result, setResult] = useState<ExecutionResult | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(challenge.time_limit_minutes * 60);
    const [showOriginal, setShowOriginal] = useState(false);
    const [showHints, setShowHints] = useState(false);
    const [runCount, setRunCount] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Timer countdown
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getTimerClass = () => {
        if (timeLeft <= 60) return 'timer timer-critical';
        if (timeLeft <= 180) return 'timer timer-warning';
        return 'timer';
    };

    const executeCode = async () => {
        setIsExecuting(true);
        setResult(null);

        try {
            const response = await fetch('http://127.0.0.1:8000/execute-challenge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    challenge_id: challenge.challenge_id || '',
                    student_code: code,
                    language: challenge.language,
                    test_cases: challenge.test_cases
                })
            });

            const data: ExecutionResult = await response.json();
            setResult(data);
            setRunCount(prev => prev + 1);

            if (onComplete && data.verdict === 'PASS') {
                onComplete(data);
            }

        } catch (error: any) {
            setResult({
                success: false,
                passed_tests: 0,
                total_tests: challenge.test_cases.length,
                execution_time_ms: 0,
                test_results: [],
                errors: `Connection failed: ${error.message}`,
                verdict: 'ERROR'
            });
        } finally {
            setIsExecuting(false);
        }
    };

    const getVerdictIcon = (verdict: string) => {
        switch (verdict) {
            case 'PASS': return '✅';
            case 'FAIL': return '❌';
            case 'ERROR': return '⚠️';
            default: return '❓';
        }
    };

    const getProgressPercent = () => {
        if (!result) return 0;
        return Math.round((result.passed_tests / result.total_tests) * 100);
    };

    const monacoLanguage = challenge.language === 'javascript' ? 'javascript' : 'python';

    return (
        <div className="challenge-container">
            {/* Header Bar */}
            <div className="challenge-header">
                <div className="challenge-header-left">
                    <span className="challenge-icon">⚡</span>
                    <h2>Live Coding Challenge</h2>
                </div>
                <div className="challenge-header-right">
                    <div className="run-counter">
                        Attempts: <strong>{runCount}</strong>
                    </div>
                    <div className={getTimerClass()}>
                        ⏱ {formatTime(timeLeft)}
                    </div>
                </div>
            </div>

            {/* Challenge Description */}
            <div className="challenge-body">
                <div className="challenge-instructions">
                    <div className="challenge-task-box">
                        <h3>🎯 Your Task</h3>
                        <p>{challenge.challenge_description}</p>
                    </div>

                    <div className="challenge-requirements">
                        <h4>Requirements:</h4>
                        <ul>
                            {challenge.requirements.map((req, i) => (
                                <li key={i}>
                                    <span className="req-bullet">→</span> {req}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Original Code Toggle */}
                    <button
                        className="btn-ghost"
                        onClick={() => setShowOriginal(!showOriginal)}
                    >
                        {showOriginal ? '🔽 Hide' : '📄 Show'} Your Original Code ({challenge.filename})
                    </button>

                    {showOriginal && (
                        <div className="original-code-block">
                            <pre><code>{challenge.original_code}</code></pre>
                        </div>
                    )}

                    {/* Hints Toggle */}
                    {challenge.hints && challenge.hints.length > 0 && (
                        <>
                            <button
                                className="btn-ghost hint-btn"
                                onClick={() => setShowHints(!showHints)}
                            >
                                {showHints ? '🔽 Hide Hints' : '💡 Show Hints'}
                            </button>
                            {showHints && (
                                <div className="hints-box">
                                    {challenge.hints.map((hint, i) => (
                                        <p key={i}>💡 {hint}</p>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Test Cases Preview */}
                    <div className="test-cases-preview">
                        <h4>Test Cases ({challenge.test_cases.length}):</h4>
                        {challenge.test_cases.slice(0, 2).map((tc, i) => (
                            <div key={i} className="test-case-card">
                                <div className="test-case-header">
                                    Test {i + 1} {tc.description && `- ${tc.description}`}
                                </div>
                                <div className="test-case-io">
                                    <div>
                                        <span className="io-label">Input:</span>
                                        <code>{JSON.stringify(tc.input)}</code>
                                    </div>
                                    <div>
                                        <span className="io-label">Expected:</span>
                                        <code>{JSON.stringify(tc.expected_output)}</code>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {challenge.test_cases.length > 2 && (
                            <p className="hidden-tests">
                                +{challenge.test_cases.length - 2} hidden test{challenge.test_cases.length - 2 > 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                </div>

                {/* Code Editor */}
                <div className="challenge-editor-section">
                    <div className="editor-toolbar">
                        <span className="editor-lang-badge">{challenge.language.toUpperCase()}</span>
                        <span className="editor-label">Write your solution below</span>
                    </div>

                    <div className="monaco-wrapper">
                        <Editor
                            height="380px"
                            language={monacoLanguage}
                            value={code}
                            onChange={(value) => setCode(value || '')}
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 2,
                                wordWrap: 'on',
                                padding: { top: 12 }
                            }}
                        />
                    </div>

                    {/* Execute Button */}
                    <button
                        onClick={executeCode}
                        disabled={isExecuting || timeLeft === 0}
                        className={`btn-execute ${isExecuting ? 'executing' : ''}`}
                    >
                        {isExecuting ? (
                            <>
                                <span className="exec-spinner"></span>
                                Running Tests...
                            </>
                        ) : timeLeft === 0 ? (
                            '⏰ Time Expired'
                        ) : (
                            '🚀 Run Tests'
                        )}
                    </button>

                    {/* Results Panel */}
                    {result && (
                        <div className={`execution-results verdict-${result.verdict.toLowerCase()}`}>
                            <div className="results-header">
                                <h3>
                                    {getVerdictIcon(result.verdict)}{' '}
                                    {result.verdict === 'PASS'
                                        ? 'All Tests Passed!'
                                        : result.verdict === 'FAIL'
                                            ? 'Some Tests Failed'
                                            : 'Execution Error'}
                                </h3>
                                <span className="exec-time">{result.execution_time_ms.toFixed(0)}ms</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="progress-bar-container">
                                <div
                                    className="progress-bar-fill"
                                    style={{
                                        width: `${getProgressPercent()}%`,
                                        background: result.verdict === 'PASS'
                                            ? 'var(--success)'
                                            : result.verdict === 'FAIL'
                                                ? 'var(--warning)'
                                                : 'var(--danger)'
                                    }}
                                ></div>
                                <span className="progress-label">
                                    {result.passed_tests}/{result.total_tests} passed
                                </span>
                            </div>

                            {/* Error Display */}
                            {result.errors && (
                                <div className="error-output">
                                    <strong>Error:</strong>
                                    <pre>{result.errors}</pre>
                                </div>
                            )}

                            {/* Individual Test Results */}
                            <div className="test-results-list">
                                {result.test_results?.map((test, i) => (
                                    <div
                                        key={i}
                                        className={`test-result-row ${test.passed ? 'passed' : 'failed'}`}
                                    >
                                        <div className="test-result-status">
                                            {test.passed ? '✅' : '❌'} Test {test.test_num}
                                        </div>
                                        {!test.passed && (
                                            <div className="test-result-details">
                                                <div><span className="detail-label">Input:</span> <code>{JSON.stringify(test.input)}</code></div>
                                                <div><span className="detail-label">Expected:</span> <code>{JSON.stringify(test.expected)}</code></div>
                                                <div><span className="detail-label">Got:</span> <code>{JSON.stringify(test.actual)}</code></div>
                                                {test.error && (
                                                    <div className="test-error">
                                                        <span className="detail-label">Error:</span> {test.error}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveCodingChallenge;
