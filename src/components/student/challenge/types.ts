export interface TestCase {
  id: string;
  name: string;
  input: string;
  expected: string;
}

export interface TestResult {
  testCaseId: string;
  passed: boolean;
  got: string;
  message: string;
  runtimeMs: number;
}

export interface ChallengeRunResult {
  total: number;
  passed: number;
  runtimeMs: number;
  hiddenPassed: number;
  hiddenTotal: number;
  details: TestResult[];
}
