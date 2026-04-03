import { apkManager } from '@/lib/valaBuilder/apkManager';
import { deployManager } from '@/lib/valaBuilder/deployManager';
import { scanEngine } from '@/lib/valaBuilder/scanner';
import { valaJobStore } from '@/lib/valaBuilder/store';

export function postAiScanFull(jobId: string) {
  const job = valaJobStore.read(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }
  const report = scanEngine.runFullScan(job);
  valaJobStore.appendScan(jobId, report);
  return scanEngine.asApiResponse(report);
}

export function postDeployAuto(jobId: string) {
  const job = valaJobStore.read(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  const response = deployManager.deployAuto(job);
  valaJobStore.appendDeploy(jobId, response.deploy, response.rollback);
  return response;
}

export function getApkStatus(jobId: string, apkId: string) {
  const job = valaJobStore.read(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }
  return apkManager.getStatus(job, apkId);
}
