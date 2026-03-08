/**
 * PHASE 4 — LIVE COGNITIVE LOAD MEASUREMENT
 * keystrokeProfiler.ts
 * 
 * Tracks behavioral telemetry during the live coding crucible to separate
 * real human typing patterns from AI-assisted auto-completions and pastes.
 */

export interface KeystrokeEvent {
    key: string;
    timestamp: number;
    type: 'keydown' | 'paste' | 'delete';
}

export interface BehavioralSignature {
    avg_typing_speed_wpm: number;
    pause_pattern: number;           // avg ms between bursts
    edit_frequency: number;          // backspace/delete ratio
    paste_events: number;            // count of paste operations
    thinking_latency: number;        // longest pause
    cognitive_load_score: number;    // 0-100 authenticity probability
    anomalies: string[];
}

export class KeystrokeProfiler {
    private events: KeystrokeEvent[] = [];
    private startTime: number = Date.now();

    public logKeydown(key: string) {
        this.events.push({
            key,
            timestamp: Date.now(),
            type: (key === 'Backspace' || key === 'Delete') ? 'delete' : 'keydown'
        });
    }

    public logPaste() {
        this.events.push({
            key: 'PASTE_BLOCK',
            timestamp: Date.now(),
            type: 'paste'
        });
    }

    public getProfile(): BehavioralSignature {
        const now = Date.now();
        const totalTimeSpanMins = (now - this.startTime) / 60000 || 0.1; // minimum 0.1 mins

        let keystrokes = 0;
        let deletes = 0;
        let pastes = 0;
        let maxPause = 0;
        let pauses: number[] = [];

        for (let i = 0; i < this.events.length; i++) {
            const ev = this.events[i];
            if (ev.type === 'keydown') keystrokes++;
            if (ev.type === 'delete') deletes++;
            if (ev.type === 'paste') pastes++;

            if (i > 0) {
                const gap = ev.timestamp - this.events[i - 1].timestamp;
                if (gap > 2000) { // arbitrary threshold for "think" pause
                    pauses.push(gap);
                    if (gap > maxPause) maxPause = gap;
                }
            }
        }

        // Compute Metrics
        const avgWpm = (keystrokes / 5) / totalTimeSpanMins;
        const deleteRatio = (keystrokes + deletes) > 0 ? (deletes / (keystrokes + deletes)) : 0;
        const avgPause = pauses.length > 0 ? (pauses.reduce((a, b) => a + b, 0) / pauses.length) : 0;

        // Neural Analysis - Authenticity Math
        let authenticityScore = 100;
        const anomalies: string[] = [];

        // Red flag: Zero deletes 
        if (deleteRatio === 0 && keystrokes > 50) {
            authenticityScore -= 30;
            anomalies.push("perfect_typing_anomaly"); // Humans make typos
        }

        // Red flag: Pasting
        if (pastes > 0) {
            authenticityScore -= (pastes * 40); // very punishing
            anomalies.push("external_clipboard_drop");
        }

        // Red flag: Impossible Speed
        if (avgWpm > 180) {
            authenticityScore -= 50;
            anomalies.push("superhuman_typing_velocity");
        }

        // Red flag: No pauses
        if (keystrokes > 100 && maxPause < 1000) {
            authenticityScore -= 20;
            anomalies.push("absence_of_cognitive_latency");
        }

        return {
            avg_typing_speed_wpm: Math.round(avgWpm),
            pause_pattern: Math.round(avgPause),
            edit_frequency: Number(deleteRatio.toFixed(3)),
            paste_events: pastes,
            thinking_latency: maxPause,
            cognitive_load_score: Math.max(0, authenticityScore),
            anomalies
        };
    }
}
