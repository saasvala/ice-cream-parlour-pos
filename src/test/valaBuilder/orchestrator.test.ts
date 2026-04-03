import { beforeEach, describe, expect, it } from 'vitest';
import { valaOrchestrator } from '@/lib/valaBuilder/orchestrator';
import { valaJobStore } from '@/lib/valaBuilder/store';

function clearStorage() {
  window.localStorage.removeItem('vala_builder_jobs');
}

describe('vala orchestrator', () => {
  beforeEach(() => {
    clearStorage();
  });

  it('runs pipeline to completion with stage outputs', () => {
    const job = valaOrchestrator.createJob('School Management Software');
    const completed = valaOrchestrator.runToCompletion(job.id);

    expect(completed.status).toBe('completed');
    expect(completed.currentStage).toBeNull();
    expect(completed.outputs.planner).toBeTruthy();
    expect(completed.outputs.deployer).toBeTruthy();
    expect(completed.latestBuild?.success).toBe(true);
    expect(completed.latestDeploy?.strategy).toBe('blue-green');
    expect(completed.latestApk?.status).toBe('ready');
  });

  it('supports resume from failed stage without restarting', () => {
    const job = valaOrchestrator.createJob('Resume failure test');
    const staged = valaOrchestrator.runStage(job.id, 'planner');

    const plannerStage = staged.stages.find((stage) => stage.id === 'planner');
    expect(plannerStage?.status).toBe('succeeded');

    const forcedFailure = {
      ...staged,
      stages: staged.stages.map((stage) =>
        stage.id === 'architect' ? { ...stage, status: 'failed' as const, error: 'simulated fail' } : stage,
      ),
      status: 'failed' as const,
      currentStage: 'architect' as const,
    };

    valaJobStore.upsert(forcedFailure);

    const resumed = valaOrchestrator.resumeFromFailed(job.id);
    const architectStage = resumed.stages.find((stage) => stage.id === 'architect');

    expect(architectStage?.status).toBe('succeeded');
    expect(resumed.outputs.architect).toBeTruthy();
  });
});
