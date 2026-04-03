import type {
  ApkBuildRecord,
  BuildExecution,
  DeployRecord,
  GovernancePolicy,
  ObservabilitySnapshot,
  RollbackPoint,
  ScanReport,
  ValaJob,
} from '@/types/valaBuilder';

const STORAGE_KEY = 'vala_builder_jobs';

function getNowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const DEFAULT_GOVERNANCE_POLICY: GovernancePolicy = {
  maxRetriesPerStage: 3,
  maxRepairCycles: 3,
  maxCostUnitsPerJob: 100,
};

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage;
}

export class ValaJobStore {
  private jobs: Record<string, ValaJob> = {};

  constructor() {
    this.jobs = this.load();
  }

  private load() {
    const storage = getStorage();
    if (!storage) {
      return {};
    }

    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw) as Record<string, ValaJob>;
      return parsed || {};
    } catch {
      return {};
    }
  }

  private save() {
    const storage = getStorage();
    if (!storage) {
      return;
    }
    storage.setItem(STORAGE_KEY, JSON.stringify(this.jobs));
  }

  upsert(job: ValaJob) {
    this.jobs[job.id] = { ...job, updatedAt: getNowIso() };
    this.save();
    return this.jobs[job.id];
  }

  read(jobId: string) {
    return this.jobs[jobId] ?? null;
  }

  list() {
    return Object.values(this.jobs).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  patch(jobId: string, update: Partial<ValaJob>) {
    const existing = this.jobs[jobId];
    if (!existing) return null;
    const merged: ValaJob = {
      ...existing,
      ...update,
      governance: {
        ...existing.governance,
        ...(update.governance || {}),
      },
      updatedAt: getNowIso(),
    };
    this.jobs[jobId] = merged;
    this.save();
    return merged;
  }

  appendScan(jobId: string, report: ScanReport) {
    const existing = this.jobs[jobId];
    if (!existing) return null;
    const artifacts = [
      ...existing.artifacts,
      {
        id: createId('artifact'),
        type: 'report' as const,
        name: `scan-${report.id}`,
        location: `memory://scan/${report.id}`,
        createdAt: report.createdAt,
      },
    ];
    return this.patch(jobId, { artifacts });
  }

  appendBuild(jobId: string, build: BuildExecution) {
    const existing = this.jobs[jobId];
    if (!existing) return null;
    const artifacts = [
      ...existing.artifacts,
      {
        id: createId('artifact'),
        type: 'log' as const,
        name: `build-${build.id}`,
        location: `memory://build/${build.id}`,
        createdAt: build.startedAt,
      },
    ];
    return this.patch(jobId, { latestBuild: build, artifacts });
  }

  appendDeploy(jobId: string, deploy: DeployRecord, rollbackPoint: RollbackPoint) {
    const existing = this.jobs[jobId];
    if (!existing) return null;
    const artifacts = [
      ...existing.artifacts,
      {
        id: createId('artifact'),
        type: 'deploy' as const,
        name: `deploy-${deploy.id}`,
        location: `memory://deploy/${deploy.id}`,
        createdAt: deploy.deployedAt,
      },
    ];
    const rollbackPoints = [...existing.rollbackPoints, rollbackPoint];
    return this.patch(jobId, { latestDeploy: deploy, rollbackPoints, artifacts });
  }

  appendApk(jobId: string, apk: ApkBuildRecord) {
    const existing = this.jobs[jobId];
    if (!existing) return null;
    const artifacts = apk.outputPath
      ? [
          ...existing.artifacts,
          {
            id: createId('artifact'),
            type: 'apk' as const,
            name: `apk-${apk.id}`,
            location: apk.outputPath,
            createdAt: apk.updatedAt,
          },
        ]
      : existing.artifacts;
    return this.patch(jobId, { latestApk: apk, artifacts });
  }

  getObservability(jobId: string): ObservabilitySnapshot | null {
    const job = this.jobs[jobId];
    if (!job) {
      return null;
    }
    const completedStages = job.stages.filter((s) => s.status === 'succeeded').length;
    const failedStages = job.stages.filter((s) => s.status === 'failed').length;
    return {
      jobId: job.id,
      status: job.status,
      currentStage: job.currentStage,
      completedStages,
      failedStages,
      retries: job.retries,
      artifactCount: job.artifacts.length,
      recentEvents: job.events.slice(-10),
    };
  }
}

export const valaJobStore = new ValaJobStore();
