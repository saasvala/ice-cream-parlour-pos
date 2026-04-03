import { agentExecutor } from '@/lib/valaBuilder/agentExecutor';
import { apkManager } from '@/lib/valaBuilder/apkManager';
import { buildTestWorker } from '@/lib/valaBuilder/buildWorker';
import { deployManager } from '@/lib/valaBuilder/deployManager';
import { evaluateQualityGate } from '@/lib/valaBuilder/qualityPolicy';
import { repairEngine } from '@/lib/valaBuilder/repair';
import { scanEngine } from '@/lib/valaBuilder/scanner';
import { createPipelineStages, getNextStage } from '@/lib/valaBuilder/stageDefinitions';
import { DEFAULT_GOVERNANCE_POLICY, valaJobStore } from '@/lib/valaBuilder/store';
import type { JobEvent, StageExecution, ValaAgentId, ValaJob } from '@/types/valaBuilder';

function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function createEvent(type: JobEvent['type'], message: string): JobEvent {
  return {
    id: createId('event'),
    type,
    message,
    createdAt: new Date().toISOString(),
  };
}

function cloneJob(job: ValaJob): ValaJob {
  return JSON.parse(JSON.stringify(job));
}

function findStage(job: ValaJob, stageId: ValaAgentId) {
  return job.stages.find((stage) => stage.id === stageId) as StageExecution | undefined;
}

function updateStage(job: ValaJob, stageId: ValaAgentId, updater: (stage: StageExecution) => StageExecution) {
  job.stages = job.stages.map((stage) => (stage.id === stageId ? updater(stage) : stage));
}

export class ValaOrchestrator {
  createJob(prompt: string) {
    const createdAt = new Date().toISOString();
    const job: ValaJob = {
      id: createId('job'),
      prompt,
      status: 'queued',
      currentStage: 'planner',
      stages: createPipelineStages(DEFAULT_GOVERNANCE_POLICY.maxRetriesPerStage),
      outputs: {},
      retries: 0,
      artifacts: [],
      rollbackPoints: [],
      events: [createEvent('stage', 'Job created and queued')],
      governance: {
        retryCount: 0,
        repairCycles: 0,
        costUnits: 0,
      },
      createdAt,
      updatedAt: createdAt,
    };

    valaJobStore.upsert(job);
    return job;
  }

  getJob(jobId: string) {
    return valaJobStore.read(jobId);
  }

  listJobs() {
    return valaJobStore.list();
  }

  runStage(jobId: string, stageId?: ValaAgentId) {
    const persisted = valaJobStore.read(jobId);
    if (!persisted) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const job = cloneJob(persisted);
    const targetStage = stageId ?? job.currentStage;
    if (!targetStage) {
      return job;
    }

    const stage = findStage(job, targetStage);
    if (!stage) {
      throw new Error(`Stage not found: ${targetStage}`);
    }

    if (stage.status === 'succeeded') {
      job.currentStage = getNextStage(targetStage);
      valaJobStore.upsert(job);
      return job;
    }

    if (stage.attempts >= stage.maxAttempts) {
      stage.status = 'failed';
      stage.error = 'Retry limit reached';
      job.status = 'failed';
      job.events.push(createEvent('governance', `Stage ${stage.id} exceeded retry budget`));
      valaJobStore.upsert(job);
      return job;
    }

    updateStage(job, targetStage, (s) => ({
      ...s,
      status: 'running',
      attempts: s.attempts + 1,
      startedAt: s.startedAt ?? new Date().toISOString(),
      error: undefined,
    }));

    const runningStage = findStage(job, targetStage)!;
    const result = agentExecutor.execute(runningStage, {
      prompt: job.prompt,
      upstreamOutputs: job.outputs,
    });

    if (!result.success || !result.output) {
      updateStage(job, targetStage, (s) => ({
        ...s,
        status: 'failed',
        completedAt: new Date().toISOString(),
        error: result.error || 'Stage execution failed',
      }));
      job.status = 'failed';
      job.retries += 1;
      job.governance.retryCount += 1;
      job.events.push(createEvent('stage', `Stage ${targetStage} failed`));
      valaJobStore.upsert(job);
      return job;
    }

    updateStage(job, targetStage, (s) => ({
      ...s,
      status: 'succeeded',
      completedAt: new Date().toISOString(),
      output: result.output,
    }));

    job.outputs[targetStage] = result.output;
    job.currentStage = getNextStage(targetStage);
    job.status = job.currentStage ? 'running' : 'completed';
    job.governance.costUnits += 1;
    job.events.push(createEvent('stage', `Stage ${targetStage} succeeded`));

    const quality = evaluateQualityGate(job);
    job.quality = quality;

    valaJobStore.upsert(job);
    return job;
  }

  resumeFromFailed(jobId: string) {
    const persisted = valaJobStore.read(jobId);
    if (!persisted) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const failedStage = persisted.stages.find((stage) => stage.status === 'failed');
    if (!failedStage) {
      return persisted;
    }

    const cloned = cloneJob(persisted);
    updateStage(cloned, failedStage.id, (stage) => ({
      ...stage,
      status: 'pending',
      error: undefined,
    }));
    cloned.currentStage = failedStage.id;
    cloned.status = 'running';
    cloned.events.push(createEvent('stage', `Resumed from failed stage ${failedStage.id}`));

    valaJobStore.upsert(cloned);
    return this.runStage(cloned.id, failedStage.id);
  }

  runToCompletion(jobId: string) {
    let job = valaJobStore.read(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    while (job.currentStage && job.status !== 'failed') {
      job = this.runStage(job.id, job.currentStage);
    }

    if (job.status === 'completed') {
      this.runAutomation(job.id);
    }

    return valaJobStore.read(job.id)!;
  }

  runAutomation(jobId: string) {
    const persisted = valaJobStore.read(jobId);
    if (!persisted) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const job = cloneJob(persisted);
    const report = scanEngine.runFullScan(job);
    valaJobStore.appendScan(job.id, report);
    job.events.push(createEvent('scan', `Scan completed with ${report.errors.length} errors`));

    if (report.errors.length > 0) {
      const repairOutcome = repairEngine.applyRepair(job, report);
      job.events.push(createEvent('repair', `Repair applied for ${repairOutcome.actions.length} issues`));

      if (job.governance.repairCycles > DEFAULT_GOVERNANCE_POLICY.maxRepairCycles) {
        job.status = 'failed';
        job.events.push(createEvent('governance', 'Repair cycle limit exceeded'));
        valaJobStore.upsert(job);
        return job;
      }
    }

    const build = buildTestWorker.run(job);
    job.latestBuild = build;
    job.events.push(createEvent('build', `Build worker finished: ${build.classification}`));
    valaJobStore.appendBuild(job.id, build);

    if (!build.success || !job.quality?.passed) {
      job.status = 'failed';
      job.events.push(createEvent('build', 'Quality gates prevented deployment'));
      valaJobStore.upsert(job);
      return job;
    }

    const deployResponse = deployManager.deployAuto(job);
    job.latestDeploy = deployResponse.deploy;
    job.rollbackPoints.push(deployResponse.rollback);
    job.events.push(createEvent('deploy', `Blue-green switched to ${deployResponse.deploy.switchedLiveSlot}`));
    valaJobStore.appendDeploy(job.id, deployResponse.deploy, deployResponse.rollback);

    const apk = apkManager.buildApk(job);
    job.latestApk = apk;
    job.events.push(createEvent('apk', `APK status: ${apk.status}`));
    valaJobStore.appendApk(job.id, apk);

    job.status = 'completed';
    job.updatedAt = new Date().toISOString();
    valaJobStore.upsert(job);

    return job;
  }

  monitorSelfHealing(jobId: string, cycles = 1) {
    let latestJob = valaJobStore.read(jobId);
    if (!latestJob) {
      throw new Error(`Job not found: ${jobId}`);
    }

    for (let index = 0; index < cycles; index += 1) {
      latestJob = this.runAutomation(jobId);
      if (latestJob.status === 'failed') {
        break;
      }
    }

    return latestJob;
  }
}

export const valaOrchestrator = new ValaOrchestrator();
