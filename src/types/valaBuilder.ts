export type ValaAgentId =
  | 'planner'
  | 'architect'
  | 'ui_builder'
  | 'backend_dev'
  | 'db_engineer'
  | 'integrator'
  | 'debugger'
  | 'tester'
  | 'optimizer'
  | 'deployer';

export type StageStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'skipped';
export type JobStatus = 'queued' | 'running' | 'failed' | 'completed';
export type ScanSeverity = 'error' | 'warning';
export type ApkLifecycleStatus = 'pending' | 'building' | 'converting' | 'ready' | 'failed';

export interface StageContract {
  input: string[];
  output: string[];
  handoffTo?: ValaAgentId;
}

export interface AgentStageOutput {
  summary: string;
  payload: Record<string, unknown>;
  artifacts: string[];
  metrics: Record<string, number>;
}

export interface StageExecution {
  id: ValaAgentId;
  status: StageStatus;
  attempts: number;
  maxAttempts: number;
  contract: StageContract;
  startedAt?: string;
  completedAt?: string;
  output?: AgentStageOutput;
  error?: string;
}

export interface JobArtifact {
  id: string;
  type: 'report' | 'build' | 'deploy' | 'apk' | 'log';
  name: string;
  location: string;
  createdAt: string;
}

export interface RollbackPoint {
  id: string;
  version: number;
  releaseId: string;
  createdAt: string;
  metadata: Record<string, string>;
}

export interface ScanIssue {
  id: string;
  severity: ScanSeverity;
  category: 'code' | 'build' | 'api' | 'db' | 'routes' | 'auth' | 'performance';
  message: string;
  fixSuggestion: string;
}

export interface ScanReport {
  id: string;
  jobId: string;
  createdAt: string;
  errors: ScanIssue[];
  warnings: ScanIssue[];
  fix_suggestion: string[];
}

export interface BuildExecution {
  id: string;
  jobId: string;
  startedAt: string;
  endedAt?: string;
  success: boolean;
  installLog: string;
  buildLog: string;
  testLog: string;
  classification: 'ok' | 'build_failure' | 'test_failure';
}

export interface DeployRecord {
  id: string;
  jobId: string;
  version: number;
  strategy: 'blue-green';
  candidateSlot: 'blue' | 'green';
  previousLiveSlot: 'blue' | 'green';
  switchedLiveSlot: 'blue' | 'green';
  healthChecksPassed: boolean;
  deployedAt: string;
}

export interface ApkBuildRecord {
  id: string;
  jobId: string;
  status: ApkLifecycleStatus;
  outputPath?: string;
  updatedAt: string;
  history: ApkLifecycleStatus[];
}

export interface QualityGateResult {
  uiComplete: boolean;
  apiComplete: boolean;
  dbComplete: boolean;
  routesWorking: boolean;
  authWorking: boolean;
  passed: boolean;
  failedChecks: string[];
}

export interface GovernancePolicy {
  maxRetriesPerStage: number;
  maxRepairCycles: number;
  maxCostUnitsPerJob: number;
}

export interface GovernanceUsage {
  retryCount: number;
  repairCycles: number;
  costUnits: number;
}

export interface JobEvent {
  id: string;
  type: 'stage' | 'scan' | 'repair' | 'build' | 'deploy' | 'apk' | 'governance';
  message: string;
  createdAt: string;
}

export interface ValaJob {
  id: string;
  prompt: string;
  status: JobStatus;
  currentStage: ValaAgentId | null;
  stages: StageExecution[];
  outputs: Partial<Record<ValaAgentId, AgentStageOutput>>;
  retries: number;
  artifacts: JobArtifact[];
  rollbackPoints: RollbackPoint[];
  events: JobEvent[];
  quality?: QualityGateResult;
  latestBuild?: BuildExecution;
  latestDeploy?: DeployRecord;
  latestApk?: ApkBuildRecord;
  governance: GovernanceUsage;
  createdAt: string;
  updatedAt: string;
}

export interface ObservabilitySnapshot {
  jobId: string;
  status: JobStatus;
  currentStage: ValaAgentId | null;
  completedStages: number;
  failedStages: number;
  retries: number;
  artifactCount: number;
  recentEvents: JobEvent[];
}
