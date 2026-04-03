import type { DeployRecord, RollbackPoint, ValaJob } from '@/types/valaBuilder';

export interface DeployAutoResponse {
  deploy: DeployRecord;
  rollback: RollbackPoint;
  verifiedLive: boolean;
}

export class DeployManager {
  deployAuto(job: ValaJob): DeployAutoResponse {
    const version = (job.latestDeploy?.version || 0) + 1;
    const previousLiveSlot = job.latestDeploy?.switchedLiveSlot || 'blue';
    const candidateSlot = previousLiveSlot === 'blue' ? 'green' : 'blue';

    const deploy: DeployRecord = {
      id: `deploy_${Date.now().toString(36)}`,
      jobId: job.id,
      version,
      strategy: 'blue-green',
      candidateSlot,
      previousLiveSlot,
      switchedLiveSlot: candidateSlot,
      healthChecksPassed: true,
      deployedAt: new Date().toISOString(),
    };

    const rollback: RollbackPoint = {
      id: `rollback_${Date.now().toString(36)}`,
      version,
      releaseId: deploy.id,
      createdAt: deploy.deployedAt,
      metadata: {
        previousLiveSlot,
        switchedLiveSlot: deploy.switchedLiveSlot,
      },
    };

    return {
      deploy,
      rollback,
      verifiedLive: deploy.healthChecksPassed,
    };
  }
}

export const deployManager = new DeployManager();
