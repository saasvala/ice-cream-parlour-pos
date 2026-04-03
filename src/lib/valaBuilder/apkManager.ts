import type { ApkBuildRecord, ApkLifecycleStatus, ValaJob } from '@/types/valaBuilder';

export class ApkManager {
  buildApk(job: ValaJob): ApkBuildRecord {
    const history: ApkLifecycleStatus[] = ['pending', 'building', 'converting', 'ready'];

    return {
      id: `apk_${Date.now().toString(36)}`,
      jobId: job.id,
      status: 'ready',
      outputPath: `/apk/${job.id}/app-debug.apk`,
      updatedAt: new Date().toISOString(),
      history,
    };
  }

  getStatus(job: ValaJob, id: string): ApkBuildRecord {
    if (job.latestApk && job.latestApk.id === id) {
      return job.latestApk;
    }

    return {
      id,
      jobId: job.id,
      status: 'pending',
      updatedAt: new Date().toISOString(),
      history: ['pending'],
    };
  }
}

export const apkManager = new ApkManager();
