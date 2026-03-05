import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  DEFAULT_TEACHER_SETTINGS,
  buildInitialVivaState,
} from "./mockData";
import {
  listTeacherSubmissions,
  updateTeacherSubmissionStatus as updateTeacherSubmissionStatusApi,
  type SubmissionStatus as ApiSubmissionStatus,
  type TeacherSubmissionRecord,
} from "../../lib/api";
import type {
  Submission,
  TeacherRiskLevel,
  TeacherSettingsState,
  TeacherSubmissionStatus,
  VivaQuestion,
  VivaOutcome,
  VivaQueueStatus,
  VivaSubmissionState,
} from "./types";

export type ReportDecision = "Accept" | "Needs Viva" | "Flag";

interface EvaluationState {
  rating: number;
  checklist: Record<string, boolean>;
}

interface TeacherDataContextValue {
  submissions: Submission[];
  updateSubmissionStatus: (submissionId: string, status: TeacherSubmissionStatus) => void;
  updateVivaStatus: (submissionId: string, status: VivaQueueStatus) => void;
  setVivaOutcome: (submissionId: string, outcome: VivaOutcome | null) => void;
  toggleQuestionAsked: (submissionId: string, questionId: string) => void;
  setQuestionNotes: (submissionId: string, questionId: string, notes: string) => void;
  vivaState: Record<string, VivaSubmissionState>;
  settings: TeacherSettingsState;
  updateSettings: (patch: Partial<TeacherSettingsState>) => void;
  notesBySubmission: Record<string, string>;
  setTeacherNotes: (submissionId: string, notes: string) => void;
  decisionsBySubmission: Record<string, ReportDecision | null>;
  setDecision: (submissionId: string, decision: ReportDecision | null) => void;
  evaluationBySubmission: Record<string, EvaluationState>;
  setEvaluationRating: (submissionId: string, rating: number) => void;
  toggleEvaluationCheck: (submissionId: string, checkId: string) => void;
}

const DEFAULT_CHECKLIST = {
  architecture: true,
  explanation: false,
  testing: false,
  originality: false,
  deployment: false,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toTeacherStatus(status: ApiSubmissionStatus): TeacherSubmissionStatus {
  if (status === "completed" || status === "done") {
    return "Completed";
  }
  return "Under Review";
}

function toApiStatus(status: TeacherSubmissionStatus): ApiSubmissionStatus {
  return status === "Completed" ? "completed" : "submitted";
}

function inferProjectType(techTags: string[]): Submission["projectType"] {
  const normalizedTags = techTags.map((tag) => tag.toLowerCase());

  if (normalizedTags.some((tag) => ["mobile", "android", "ios", "flutter", "react-native"].includes(tag))) {
    return "mobile";
  }

  if (normalizedTags.some((tag) => ["cli", "command-line", "terminal", "console"].includes(tag))) {
    return "cli";
  }

  return "web";
}

function inferBranch(rollNumber: string, techTags: string[]) {
  const match = rollNumber.toUpperCase().match(/[A-Z]{2,5}/g);
  if (match?.length) {
    return match[0];
  }

  const branchTag = techTags.find((tag) => /^[A-Za-z]{2,5}$/.test(tag));
  if (branchTag) {
    return branchTag.toUpperCase();
  }

  return "GEN";
}

function mapRiskLevel(raw: string | null | undefined): TeacherRiskLevel {
  const upper = (raw ?? "").toUpperCase();
  if (upper === "CRITICAL" || upper === "HIGH") return "HIGH";
  if (upper === "SUSPICIOUS" || upper === "MONITOR" || upper === "MEDIUM") return "MEDIUM";
  if (upper === "CLEAR" || upper === "LOW" || upper === "VERIFIED") return "LOW";
  return "MEDIUM";
}

function createVivaQuestionsFromAi(submissionId: string, aiViva: string[]): VivaQuestion[] {
  return aiViva.map((q, i) => ({
    id: `${submissionId}-v${i + 1}`,
    topicTag: "AI Generated",
    difficulty: (i === 0 ? "Medium" : i === 1 ? "Easy" : "Hard") as VivaQuestion["difficulty"],
    question: q,
    expectedTalkingPoints: "",
  }));
}

function mapTeacherSubmissionRecord(record: TeacherSubmissionRecord): Submission | null {
  const id = record.id ?? record._id;
  if (!id) return null;

  const owner =
    typeof record.ownerId === "object" && record.ownerId !== null ? record.ownerId : null;

  const techTags = Array.isArray(record.techTags) ? record.techTags : [];
  const rollNumber = record.rollNumber?.trim() || "NA";
  const status = toTeacherStatus(record.status);

  // Real AI data from engine (via backend)
  const aiScore = typeof record.aiScore === "number" ? record.aiScore : 0;
  const aiSummary = record.aiSummary?.trim() || "";
  const aiFlags = record.aiFlags ?? [];
  const aiRiskLevel = record.aiRiskLevel ?? "";
  const aiRecommendation = record.aiRecommendation ?? "";
  const aiConfidence = typeof record.aiConfidence === "number" ? record.aiConfidence : 0;
  const aiViva = record.aiViva ?? [];
  const aiChallenge = record.aiChallenge ?? null;
  const aiEvidence = record.aiEvidence ?? null;

  // Extract sub-scores from evidence
  const ev = (aiEvidence ?? {}) as Record<string, unknown>;
  const similarityScore = typeof ev.similarity_score === "number" ? ev.similarity_score : 0;
  const commitRiskScore = typeof ev.commit_risk_score === "number" ? ev.commit_risk_score : 0;
  const aiDetectionProbability = typeof ev.ai_detection_probability === "number" ? ev.ai_detection_probability : 0;
  const codeQualityScore = typeof ev.code_quality_score === "number" ? ev.code_quality_score : 0;

  const originalityPercent = clamp(Math.round(aiScore), 0, 100);
  const plagiarismPercent = clamp(Math.round(similarityScore * 100), 0, 100);

  const riskLevel = mapRiskLevel(aiRiskLevel);

  return {
    id,
    studentName: owner?.name?.trim() || "Student",
    rollNumber,
    branch: inferBranch(rollNumber, techTags),
    projectTitle: record.title,
    submittedAt: record.createdAt,
    status,
    riskLevel,
    projectType: inferProjectType(techTags),
    liveDemoUrl: record.liveDemoUrl,
    githubUrl: record.repoUrl,

    // Pass-through AI fields (exact same data as student side)
    aiScore,
    aiSummary: aiSummary || `Submission is currently ${status === "Completed" ? "completed" : "under review"}.`,
    aiFlags,
    aiRiskLevel,
    aiRecommendation,
    aiConfidence,
    aiViva,
    aiChallenge,
    aiEvidence,

    // Derived convenience fields
    originalityPercent,
    plagiarismPercent,
    similarityScore,
    commitRiskScore,
    aiDetectionProbability,
    codeQualityScore,
    summaryNarrative: aiSummary || `Submission is currently ${status === "Completed" ? "completed" : "under review"} with ${aiFlags.length} signal flag(s).`,
    vivaQuestions: aiViva.length > 0 ? createVivaQuestionsFromAi(id, aiViva) : [],
  };
}

function mergeVivaStateWithSubmissions(
  current: Record<string, VivaSubmissionState>,
  submissions: Submission[],
) {
  const seeded = buildInitialVivaState(submissions);

  return Object.fromEntries(
    submissions.map((submission) => {
      const seededEntry = seeded[submission.id];
      const currentEntry = current[submission.id];

      if (!currentEntry) {
        return [submission.id, seededEntry];
      }

      return [
        submission.id,
        {
          ...seededEntry,
          ...currentEntry,
          questions: {
            ...seededEntry.questions,
            ...currentEntry.questions,
          },
        },
      ];
    }),
  ) as Record<string, VivaSubmissionState>;
}

const TeacherDataContext = createContext<TeacherDataContextValue | null>(null);

export function TeacherDataProvider({ children }: PropsWithChildren) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [vivaState, setVivaState] = useState<Record<string, VivaSubmissionState>>({});
  const [settings, setSettings] = useState<TeacherSettingsState>(DEFAULT_TEACHER_SETTINGS);
  const [notesBySubmission, setNotesBySubmission] = useState<Record<string, string>>({});
  const [decisionsBySubmission, setDecisionsBySubmission] = useState<
    Record<string, ReportDecision | null>
  >({});
  const [evaluationBySubmission, setEvaluationBySubmission] = useState<
    Record<string, EvaluationState>
  >({});

  const loadTeacherSubmissions = useCallback(async () => {
    try {
      const response = await listTeacherSubmissions({ page: 1, limit: 200 });
      const mappedSubmissions = response.items
        .map(mapTeacherSubmissionRecord)
        .filter((item): item is Submission => item !== null);

      setSubmissions(mappedSubmissions);
      setVivaState((current) => mergeVivaStateWithSubmissions(current, mappedSubmissions));
    } catch (error) {
      console.error("[teacher] failed to load submissions", error);
      setSubmissions([]);
      setVivaState({});
    }
  }, []);

  useEffect(() => {
    void loadTeacherSubmissions();
  }, [loadTeacherSubmissions]);

  const updateSubmissionStatus = (submissionId: string, status: TeacherSubmissionStatus) => {
    setSubmissions((current) => {
      const next = current.map((item) =>
        item.id === submissionId ? { ...item, status } : item,
      );
      setVivaState((currentViva) => mergeVivaStateWithSubmissions(currentViva, next));
      return next;
    });

    void updateTeacherSubmissionStatusApi(submissionId, toApiStatus(status))
      .then((response) => {
        const mapped = mapTeacherSubmissionRecord(response.submission);
        if (!mapped) return;

        setSubmissions((current) => {
          const next = current.map((item) =>
            item.id === submissionId ? mapped : item,
          );
          setVivaState((currentViva) => mergeVivaStateWithSubmissions(currentViva, next));
          return next;
        });
      })
      .catch((error) => {
        console.error("[teacher] failed to update submission status", error);
        void loadTeacherSubmissions();
      });
  };

  const updateVivaStatus = (submissionId: string, status: VivaQueueStatus) => {
    setVivaState((current) => ({
      ...current,
      [submissionId]: {
        ...(current[submissionId] ?? { status: "Pending", outcome: null, questions: {} }),
        status,
      },
    }));
  };

  const setVivaOutcome = (submissionId: string, outcome: VivaOutcome | null) => {
    setVivaState((current) => ({
      ...current,
      [submissionId]: {
        ...(current[submissionId] ?? { status: "Pending", outcome: null, questions: {} }),
        outcome,
      },
    }));
  };

  const toggleQuestionAsked = (submissionId: string, questionId: string) => {
    setVivaState((current) => {
      const entry = current[submissionId];
      if (!entry) return current;
      const questionState = entry.questions[questionId];
      if (!questionState) return current;

      return {
        ...current,
        [submissionId]: {
          ...entry,
          questions: {
            ...entry.questions,
            [questionId]: {
              ...questionState,
              asked: !questionState.asked,
            },
          },
        },
      };
    });
  };

  const setQuestionNotes = (submissionId: string, questionId: string, notes: string) => {
    setVivaState((current) => {
      const entry = current[submissionId];
      if (!entry) return current;
      const questionState = entry.questions[questionId];
      if (!questionState) return current;

      return {
        ...current,
        [submissionId]: {
          ...entry,
          questions: {
            ...entry.questions,
            [questionId]: {
              ...questionState,
              notes,
            },
          },
        },
      };
    });
  };

  const updateSettings = (patch: Partial<TeacherSettingsState>) => {
    setSettings((current) => ({ ...current, ...patch }));
  };

  const setTeacherNotes = (submissionId: string, notes: string) => {
    setNotesBySubmission((current) => ({
      ...current,
      [submissionId]: notes,
    }));
  };

  const setDecision = (submissionId: string, decision: ReportDecision | null) => {
    setDecisionsBySubmission((current) => ({
      ...current,
      [submissionId]: decision,
    }));
  };

  const setEvaluationRating = (submissionId: string, rating: number) => {
    setEvaluationBySubmission((current) => ({
      ...current,
      [submissionId]: {
        rating,
        checklist: current[submissionId]?.checklist ?? { ...DEFAULT_CHECKLIST },
      },
    }));
  };

  const toggleEvaluationCheck = (submissionId: string, checkId: string) => {
    setEvaluationBySubmission((current) => {
      const entry =
        current[submissionId] ?? {
          rating: 6,
          checklist: { ...DEFAULT_CHECKLIST },
        };

      return {
        ...current,
        [submissionId]: {
          ...entry,
          checklist: {
            ...entry.checklist,
            [checkId]: !entry.checklist[checkId],
          },
        },
      };
    });
  };

  const value = useMemo<TeacherDataContextValue>(
    () => ({
      submissions,
      updateSubmissionStatus,
      updateVivaStatus,
      setVivaOutcome,
      toggleQuestionAsked,
      setQuestionNotes,
      vivaState,
      settings,
      updateSettings,
      notesBySubmission,
      setTeacherNotes,
      decisionsBySubmission,
      setDecision,
      evaluationBySubmission,
      setEvaluationRating,
      toggleEvaluationCheck,
    }),
    [
      submissions,
      vivaState,
      settings,
      notesBySubmission,
      decisionsBySubmission,
      evaluationBySubmission,
    ],
  );

  return <TeacherDataContext.Provider value={value}>{children}</TeacherDataContext.Provider>;
}

export function useTeacherData() {
  const context = useContext(TeacherDataContext);
  if (!context) {
    throw new Error("useTeacherData must be used within TeacherDataProvider");
  }
  return context;
}
