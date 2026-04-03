import { beforeEach, describe, expect, it } from 'vitest';
import { getApkStatus, postAiScanFull, postDeployAuto } from '@/lib/valaBuilder/api';
import { valaOrchestrator } from '@/lib/valaBuilder/orchestrator';

function clearStorage() {
  window.localStorage.removeItem('vala_builder_jobs');
}

describe('vala diagnostics api', () => {
  beforeEach(() => {
    clearStorage();
  });

  it('returns scan report shape for /ai/scan-full', () => {
    const job = valaOrchestrator.createJob('scan api test');
    valaOrchestrator.runStage(job.id, 'planner');

    const report = postAiScanFull(job.id);

    expect(Array.isArray(report.errors)).toBe(true);
    expect(Array.isArray(report.warnings)).toBe(true);
    expect(Array.isArray(report.fix_suggestion)).toBe(true);
  });

  it('returns deploy and apk status payloads', () => {
    const job = valaOrchestrator.createJob('deploy api test');
    const completed = valaOrchestrator.runToCompletion(job.id);

    const deploy = postDeployAuto(completed.id);
    const apk = getApkStatus(completed.id, completed.latestApk!.id);

    expect(deploy.deploy.strategy).toBe('blue-green');
    expect(deploy.rollback.releaseId).toBe(deploy.deploy.id);
    expect(apk.status).toBe('ready');
  });
});
