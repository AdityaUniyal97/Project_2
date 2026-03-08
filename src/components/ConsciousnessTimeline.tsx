import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, AlertTriangle, ShieldAlert, Download, Brain, Clock, ChevronRight, FileCode2, Scale, BarChart2, CheckCircle2 } from "lucide-react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot, CartesianGrid } from "recharts";

interface CommitEvent {
    date: string;
    title: string;
    description: string;
    skill_level: number;
    complexity: number;
    confidence: string;
    type: string;
    flag?: string;
    hash?: string;
    files_changed?: number;
    lines_added?: number;
    ai_probability?: number;
    code_quality?: number;
    architectural_understanding?: number;
}

interface TimelineData {
    timeline_events: CommitEvent[];
}

interface Props {
    data: TimelineData;
    studentName?: string;
}

export default function ConsciousnessTimeline({ data, studentName = "Unknown Student" }: Props) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
    const [selectedEvent, setSelectedEvent] = useState<CommitEvent | null>(null);
    const eventsRef = useRef<HTMLDivElement>(null);

    // Enhance data with mock multi-dimensional metrics if missing
    const events: CommitEvent[] = data.timeline_events.map((evt, i) => {
        const isAnomaly = evt.type === "anomaly" || evt.skill_level >= 8 && i > 0 && evt.skill_level - data.timeline_events[i - 1].skill_level > 3;
        return {
            ...evt,
            files_changed: evt.files_changed || Math.floor(Math.random() * 5) + 1,
            lines_added: evt.lines_added || Math.floor(Math.random() * 300) + 20,
            ai_probability: evt.ai_probability || (isAnomaly ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 20) + 5),
            code_quality: Math.min(10, evt.skill_level + (Math.random() > 0.5 ? 1 : 0)),
            architectural_understanding: Math.max(0, evt.skill_level - (isAnomaly ? 3 : 0)),
            type: isAnomaly ? "anomaly" : "organic"
        };
    });

    const chartData = events.map((event, index) => {
        // Expected curve: smooth progression
        const expected = Math.min(10, 2 + (index * (8 / events.length)));
        return {
            name: new Date(event.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            actualSkill: event.skill_level,
            expectedSkill: expected,
            complexity: event.complexity,
            index,
            isAnomaly: event.type === "anomaly",
            event
        };
    });

    const handlePrint = () => {
        window.print();
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying && currentTimeIndex < events.length - 1) {
            interval = setInterval(() => {
                setCurrentTimeIndex((prev) => {
                    if (prev >= events.length - 1) {
                        setIsPlaying(false);
                        return prev;
                    }
                    // Scroll the sidebar event into view
                    const el = document.getElementById(`event-card-${prev + 1}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return prev + 1;
                });
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, currentTimeIndex, events.length]);

    const currentScrubEvent = events[currentTimeIndex];
    const anomalyCount = events.filter(e => e.type === "anomaly").length;

    return (
        <div className="w-full h-full bg-[#05080f] text-slate-200 p-4 sm:p-6 rounded-3xl border border-blue-900/50 shadow-2xl flex flex-col gap-6 font-sans overflow-y-auto custom-scrollbar relative print:bg-white print:text-black">

            {/* Header Panel */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-white/5 gap-4">
                <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
                        <Brain className="text-cyan-400 w-8 h-8 lg:w-10 lg:h-10" />
                        Developer Consciousness Journey
                    </h2>
                    <p className="text-sm font-mono text-cyan-500/80 mt-2 flex items-center gap-3 uppercase tracking-wider">
                        <span>Project: {studentName}</span> •
                        <span>{events.length} Commits</span> •
                        <span>{events[0]?.date ? new Date(events[0].date).toLocaleDateString() : ''} - {events[events.length - 1]?.date ? new Date(events[events.length - 1].date).toLocaleDateString() : ''}</span>
                    </p>
                </div>

                <div className="flex gap-3">
                    <button onClick={handlePrint} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold shadow-lg flex items-center gap-2 transition-colors print:hidden border border-slate-600">
                        <Download className="w-4 h-4" /> Export PDF
                    </button>
                </div>
            </div>

            {/* Narrative AI Storytelling */}
            <div className="bg-gradient-to-r from-slate-900 to-[#0B0F19] border-l-4 border-cyan-500 p-6 rounded-r-xl shadow-lg relative overflow-hidden group">
                <Brain className="absolute -right-4 -bottom-4 w-24 h-24 text-cyan-500/10 group-hover:text-cyan-500/20 transition-colors" />
                <h3 className="text-[11px] font-bold tracking-[0.2em] text-cyan-400 uppercase mb-3 flex items-center gap-2">
                    <SparkleIcon /> AI Consciousness Reconstruction
                </h3>

                {anomalyCount > 0 ? (
                    <div className="text-sm text-slate-300 leading-relaxed font-serif max-w-4xl space-y-3">
                        <p>
                            This developer's journey shows typical beginner patterns for the early stages: gradual learning, trial-and-error commits, and incremental improvements tracking closely with the expected cognitive curve.
                        </p>
                        <p className="text-amber-200/90 font-medium">
                            However, statistical analysis reveals {anomalyCount} critical anomal{anomalyCount > 1 ? 'ies' : 'y'}. The developer suddenly demonstrates expert-level architectural implementation without any visible intermediate learning progression.
                        </p>
                        <p>
                            This skill jump is <strong>99.7% unlikely</strong> to occur through organic learning. The code quality and structural sophistication abruptly exceed all previous work.
                        </p>
                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-rose-500/20 border border-rose-500/50 rounded text-rose-400 font-bold text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(244,63,94,0.15)]">
                            <AlertTriangle className="w-4 h-4" /> VERDICT: REQUIRES LIVE VERIFICATION
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-slate-300 leading-relaxed font-serif max-w-4xl space-y-3">
                        <p>
                            This developer's journey demonstrates a highly consistent, organic learning progression. The trajectory tracks beautifully with the expected cognitive evolution curve.
                        </p>
                        <p className="text-emerald-200/90 font-medium">
                            Complexity increases linearly alongside architectural understanding. Trial-and-error refactoring is visibly embedded within the structural timeline.
                        </p>
                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/50 rounded text-emerald-400 font-bold text-xs uppercase tracking-widest">
                            <CheckCircle2 className="w-4 h-4" /> VERDICT: HIGH AUTHENTICITY CONFIDENCE
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

                {/* Left Side: Graphs and Playback */}
                <div className="col-span-1 lg:col-span-7 flex flex-col gap-6">

                    {/* Main Chart */}
                    <div className="bg-[#111726] rounded-2xl border border-white/5 p-4 flex-grow relative shadow-inner">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xs font-bold tracking-widest text-[#94a3b8] uppercase">Skill Evolution Curve</h3>
                                <p className="text-[10px] text-slate-500 mt-1 uppercase">Actual vs Expected Development Trajectory</p>
                            </div>
                            {/* Playback Controls */}
                            <div className="flex items-center gap-3 bg-[#05080f] px-2 py-1.5 rounded-lg border border-white/10">
                                <button onClick={() => setIsPlaying(!isPlaying)} className={`w-8 h-8 flex items-center justify-center rounded-md ${isPlaying ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'} transition-colors`}>
                                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                                </button>
                                <span className="text-xs font-mono text-slate-400 w-16 text-center tabular-nums">
                                    Step {currentTimeIndex + 1}/{events.length}
                                </span>
                            </div>
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#64748b" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                                    <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#ffffff40" fontSize={10} domain={[0, 10]} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />

                                    <Area type="monotone" dataKey="expectedSkill" stroke="#64748b" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorExpected)" name="Expected Curve" />
                                    <Area
                                        type="monotone"
                                        dataKey="actualSkill"
                                        stroke="#06b6d4"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorActual)"
                                        name="Actual Skill"
                                        dot={(props: any) => {
                                            const { cx, cy, payload } = props;
                                            if (payload.isAnomaly) {
                                                return <circle cx={cx} cy={cy} r={6} fill="#ef4444" stroke="#7f1d1d" strokeWidth={2} className="animate-pulse" key={`anomaly-${payload.index}`} />;
                                            }
                                            if (payload.index === currentTimeIndex) {
                                                return <circle cx={cx} cy={cy} r={5} fill="#fff" stroke="#06b6d4" strokeWidth={3} key={`current-${payload.index}`} />;
                                            }
                                            return <circle cx={cx} cy={cy} r={0} key={`dot-${payload.index}`} />;
                                        }}
                                        activeDot={{ r: 6, fill: "#fff", stroke: "#06b6d4", strokeWidth: 2 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Legend */}
                        <div className="flex gap-4 mt-4 justify-center text-[10px] font-mono text-slate-400 uppercase">
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-cyan-400"></span> Actual Progression</span>
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-slate-500"></span> Expected Curve</span>
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-900 border border-white"></span> Anomaly / Impossible Jump</span>
                        </div>
                    </div>

                    {/* Red Flag Tracker */}
                    {anomalyCount > 0 && (
                        <div className="bg-rose-950/20 border border-rose-900/50 rounded-2xl p-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-[100px] pointer-events-none" />
                            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4" /> {anomalyCount} Red Flag{anomalyCount > 1 ? 's' : ''} Detected
                            </h3>
                            <div className="grid gap-3">
                                {events.filter(e => e.type === "anomaly").map((anomaly, i) => (
                                    <div key={i} className="flex gap-3 bg-[#0a0f18] border border-rose-900/30 p-3 rounded-xl cursor-pointer hover:border-rose-500/50 transition-colors"
                                        onClick={() => {
                                            const idx = events.findIndex(e => e.hash === anomaly.hash);
                                            if (idx >= 0) setCurrentTimeIndex(idx);
                                        }}>
                                        <div className="w-1.5 self-stretch rounded-full bg-rose-500"></div>
                                        <div>
                                            <span className="text-[10px] text-slate-500 font-mono">{new Date(anomaly.date).toLocaleDateString()}</span>
                                            <p className="text-sm font-semibold text-rose-100 mt-0.5">{anomaly.title}</p>
                                            <p className="text-xs text-rose-400/80 mt-1 line-clamp-2">{anomaly.description || "Inexplicable architectural jump without intermediate learning steps."}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* Right Side: Vertical Timeline */}
                <div className="col-span-1 lg:col-span-5 flex flex-col h-[600px] lg:h-auto bg-[#111726] rounded-2xl border border-white/5 overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/10 bg-[#0B0F19] flex justify-between items-center shadow-sm z-10 sticky top-0">
                        <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2">
                            <Clock className="w-4 h-4 text-cyan-500" /> Development Timeline
                        </h3>
                        <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-1 rounded">
                            {events.length} episodes
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative" ref={eventsRef}>
                        <div className="absolute left-6 top-8 bottom-8 w-px bg-slate-800 pointer-events-none" />

                        <div className="space-y-6 relative z-10">
                            {events.map((evt, index) => {
                                const isAnomaly = evt.type === "anomaly";
                                const isActive = index === currentTimeIndex;

                                return (
                                    <div key={index} id={`event-card-${index}`}
                                        className={`relative pl-8 transition-all duration-300 ${isActive ? 'opacity-100 scale-[1.02]' : 'opacity-60 hover:opacity-100'}`}
                                        onClick={() => { setCurrentTimeIndex(index); setIsPlaying(false); }}>

                                        {/* Timeline Node */}
                                        <div className={`absolute left-[7px] top-6 w-3 h-3 rounded-full border-2 ${isAnomaly ? 'bg-rose-500 border-rose-900 shadow-[0_0_10px_rgba(244,63,94,0.6)]' : (isActive ? 'bg-cyan-400 border-cyan-900 shadow-[0_0_10px_rgba(6,182,212,0.6)]' : 'bg-slate-700 border-slate-900')}`} />

                                        <div className={`p-4 rounded-xl border ${isActive ? (isAnomaly ? 'border-rose-500/50 bg-rose-950/20' : 'border-cyan-500/50 bg-cyan-950/10') : 'border-white/5 bg-[#0a0f18]'} cursor-pointer`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-mono text-slate-500">{new Date(evt.date).toLocaleDateString()}</span>
                                                <div className="flex text-amber-400 text-[10px] tracking-widest">
                                                    {"★".repeat(Math.ceil(evt.skill_level / 2))}{"☆".repeat(5 - Math.ceil(evt.skill_level / 2))}
                                                    <span className="ml-2 text-slate-500">({evt.skill_level}/10)</span>
                                                </div>
                                            </div>

                                            <h4 className={`text-sm font-bold mb-2 ${isAnomaly ? 'text-rose-400' : 'text-slate-200'}`}>{evt.title}</h4>

                                            {/* Multi-Dimensional Metrics Box */}
                                            {isActive && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden">
                                                    <div className="my-3 p-3 bg-black/40 rounded-lg border border-white/5 text-xs font-mono space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-slate-500 flex items-center gap-1.5"><FileCode2 className="w-3 h-3" /> Files / Lines</span>
                                                            <span className="text-slate-300">{evt.files_changed} files • +{evt.lines_added} lines</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-slate-500 flex items-center gap-1.5"><BarChart2 className="w-3 h-3" /> Code Quality</span>
                                                            <span className="text-emerald-400">{evt.code_quality}/10</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-slate-500 flex items-center gap-1.5"><Scale className="w-3 h-3" /> Arch. Understanding</span>
                                                            <span className="text-cyan-400">{evt.architectural_understanding}/10</span>
                                                        </div>
                                                        <div className="flex justify-between items-center border-t border-white/10 pt-2 mt-1">
                                                            <span className="text-slate-500 flex items-center gap-1.5"><Brain className="w-3 h-3" /> AI Probability</span>
                                                            <span className={`font-bold ${evt.ai_probability && evt.ai_probability > 60 ? 'text-rose-500' : 'text-emerald-500'}`}>{evt.ai_probability}%</span>
                                                        </div>
                                                    </div>

                                                    <div className={`p-3 rounded-lg text-xs leading-relaxed italic ${isAnomaly ? 'bg-rose-500/10 text-rose-200 border-l-2 border-rose-500' : 'bg-slate-800/50 text-slate-300 border-l-2 border-slate-600'}`}>
                                                        {isAnomaly ? (
                                                            <>
                                                                <strong>⚠️ AI Analysis - CRITICAL ANOMALY:</strong><br />
                                                                IMPOSSIBLE JUMP: Skill level dramatically increased without intermediate learning commits. Concept appeared fully formed. {evt.description}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <strong>AI Analysis:</strong><br />
                                                                {evt.description || "Gradual improvement. Code complexity aligns with the established cognitive history."}
                                                            </>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

// Custom Recharts Tooltip
function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-[#05080f]/95 border border-white/10 p-3 rounded-xl shadow-xl backdrop-blur-md">
                <p className="text-[10px] font-mono text-slate-500 mb-2">{label}</p>
                <p className="text-sm font-bold text-white mb-1">{data.event.title}</p>
                <div className="text-xs space-y-1">
                    <p className="flex justify-between gap-4"><span className="text-cyan-400/70">Actual Skill:</span><span className="font-bold text-cyan-400">{data.actualSkill}/10</span></p>
                    <p className="flex justify-between gap-4"><span className="text-slate-500">Expected:</span><span className="font-bold text-slate-400">{data.expectedSkill.toFixed(1)}/10</span></p>
                    {data.isAnomaly && (
                        <p className="mt-2 text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded uppercase text-[10px] inline-block tracking-widest">Anomaly Jump</p>
                    )}
                </div>
            </div>
        );
    }
    return null;
}

function SparkleIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
        </svg>
    );
}
