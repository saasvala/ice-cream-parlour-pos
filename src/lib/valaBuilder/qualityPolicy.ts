import type { QualityGateResult, ValaJob } from '@/types/valaBuilder';

const REQUIRED_STAGE_OUTPUTS = ['ui_builder', 'backend_dev', 'db_engineer', 'integrator'] as const;

function hasOutput(job: ValaJob, stage: (typeof REQUIRED_STAGE_OUTPUTS)[number]) {
  return Boolean(job.outputs[stage]);
}

export function evaluateQualityGate(job: ValaJob): QualityGateResult {
  const uiComplete = hasOutput(job, 'ui_builder');
  const apiComplete = hasOutput(job, 'backend_dev');
  const dbComplete = hasOutput(job, 'db_engineer');
  const routesWorking = hasOutput(job, 'integrator') && hasOutput(job, 'tester');
  const authWorking = hasOutput(job, 'backend_dev') && hasOutput(job, 'tester');

  const failedChecks = [
    !uiComplete ? 'uiComplete' : null,
    !apiComplete ? 'apiComplete' : null,
    !dbComplete ? 'dbComplete' : null,
    !routesWorking ? 'routesWorking' : null,
    !authWorking ? 'authWorking' : null,
  ].filter(Boolean) as string[];

  return {
    uiComplete,
    apiComplete,
    dbComplete,
    routesWorking,
    authWorking,
    passed: failedChecks.length === 0,
    failedChecks,
  };
}
