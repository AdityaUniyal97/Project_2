import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  DEFAULT_TEACHER_SETTINGS,
  TEACHER_SUBMISSIONS_SEED,
  buildInitialVivaState,
} from "./mockData";
import type {
  Submission,
  TeacherSettingsState,
  TeacherSubmissionStatus,
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

const TeacherDataContext = createContext<TeacherDataContextValue | null>(null);

export function TeacherDataProvider({ children }: PropsWithChildren) {
  const [submissions, setSubmissions] = useState<Submission[]>(TEACHER_SUBMISSIONS_SEED);
  const [vivaState, setVivaState] = useState<Record<string, VivaSubmissionState>>(
    buildInitialVivaState(TEACHER_SUBMISSIONS_SEED),
  );
  const [settings, setSettings] = useState<TeacherSettingsState>(DEFAULT_TEACHER_SETTINGS);
  const [notesBySubmission, setNotesBySubmission] = useState<Record<string, string>>({});
  const [decisionsBySubmission, setDecisionsBySubmission] = useState<
    Record<string, ReportDecision | null>
  >({});
  const [evaluationBySubmission, setEvaluationBySubmission] = useState<
    Record<string, EvaluationState>
  >({});

  const updateSubmissionStatus = (submissionId: string, status: TeacherSubmissionStatus) => {
    setSubmissions((current) =>
      current.map((item) => (item.id === submissionId ? { ...item, status } : item)),
    );
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
