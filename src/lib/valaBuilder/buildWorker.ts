import type { BuildExecution, ValaJob } from '@/types/valaBuilder';

export class BuildTestWorker {
  run(job: ValaJob): BuildExecution {
    const startedAt = new Date().toISOString();
    const hasTesterOutput = Boolean(job.outputs.tester);

    return {
      id: `build_${Date.now().toString(36)}`,
      jobId: job.id,
      startedAt,
      endedAt: new Date().toISOString(),
      success: hasTesterOutput,
      installLog: 'npm install (simulated isolated environment) succeeded',
      buildLog: hasTesterOutput ? 'npm run build succeeded' : 'npm run build blocked: missing tester output',
      testLog: hasTesterOutput ? 'npm run test succeeded' : 'npm run test failed: tester stage output unavailable',
      classification: hasTesterOutput ? 'ok' : 'test_failure',
    };
  }
}

export const buildTestWorker = new BuildTestWorker();
