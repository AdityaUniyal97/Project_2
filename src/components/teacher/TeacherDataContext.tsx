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
  DetectedSource,
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

function inferRiskLevel(
  plagiarismPercent: number,
  aiFlagCount: number,
  status: ApiSubmissionStatus,
): TeacherRiskLevel {
  if (status === "failed") return "CRITICAL";

  const signal = plagiarismPercent + aiFlagCount * 8;
  if (signal >= 78) return "CRITICAL";
  if (signal >= 56) return "HIGH";
  if (signal >= 34) return "MEDIUM";
  return "LOW";
}

function createVivaQuestions(submissionId: string, topicTag: string): VivaQuestion[] {
  return [
    {
      id: `${submissionId}-v1`,
      topicTag,
      difficulty: "Medium",
      question: "Walk through your architecture and core module boundaries.",
      expectedTalkingPoints: "Design choices, tradeoffs, and why this structure was selected.",
    },
    {
      id: `${submissionId}-v2`,
      topicTag: "Testing",
      difficulty: "Easy",
      question: "How did you verify correctness and handle edge cases?",
      expectedTalkingPoints: "Test strategy, critical edge cases, and validation process.",
    },
    {
      id: `${submissionId}-v3`,
      topicTag: "Security",
      difficulty: "Hard",
      question: "Which top security risks remain and how would you mitigate them?",
      expectedTalkingPoints: "Threat model, current mitigations, and improvement roadmap.",
    },
  ];
}

function deriveDetectedSources(aiFlags: string[]): DetectedSource[] {
  if (aiFlags.length === 0) {
    return [{ name: "No major similarity flags", percent: 12 }];
  }

  const cappedFlags = aiFlags.slice(0, 3);
  return cappedFlags.map((flag, index) => ({
    name: flag,
    percent: clamp(46 - index * 12, 14, 46),
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
  const originalityPercent = clamp(
    Math.round(
      typeof record.aiScore === "number"
        ? record.aiScore
        : status === "Completed"
          ? 76
          : 61,
    ),
    0,
    100,
  );
  const plagiarismPercent = clamp(100 - originalityPercent, 0, 100);
  const structuralOverlapPercent = clamp(
    Math.round(plagiarismPercent * 0.72 + (record.aiFlags?.length ?? 0) * 3),
    0,
    100,
  );
  const aiConfidencePercent = clamp(
    Math.round(58 + (record.aiFlags?.length ?? 0) * 7 + (status === "Completed" ? 8 : 0)),
    0,
    100,
  );
  const commitRiskScore = Number(
    Math.min(10, 1.8 + structuralOverlapPercent / 18 + (record.aiFlags?.length ?? 0) * 0.65).toFixed(1),
  );
  const riskLevel = inferRiskLevel(plagiarismPercent, record.aiFlags?.length ?? 0, record.status);
  const primaryTopic = techTags[0] ?? "Architecture";

  return {
    id,
    studentName: owner?.name?.trim() || "Student",
    rollNumber,
    branch: inferBranch(rollNumber, techTags),
    projectTitle: record.title,
    submittedAt: record.createdAt,
    status,
    riskLevel,
    originalityPercent,
    plagiarismPercent,
    structuralOverlapPercent,
    aiConfidencePercent,
    commitRiskScore,
    projectType: inferProjectType(techTags),
    liveDemoUrl: record.liveDemoUrl,
    githubUrl: record.repoUrl,
    summaryNarrative:
      record.aiSummary?.trim() ||
      `Submission is currently ${status === "Completed" ? "completed" : "under review"} with ${
        record.aiFlags?.length ?? 0
      } signal flag(s).`,
    detectedSources: deriveDetectedSources(record.aiFlags ?? []),
    vivaQuestions: createVivaQuestions(id, primaryTopic),
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
