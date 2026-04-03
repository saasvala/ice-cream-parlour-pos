import { useMemo, useState } from 'react';
import { Bot, Play, RefreshCw, ShieldCheck, Wrench, Activity, Rocket, Smartphone } from 'lucide-react';
import Layout from '@/components/Layout';
import { valaOrchestrator } from '@/lib/valaBuilder/orchestrator';
import { getApkStatus, postAiScanFull, postDeployAuto } from '@/lib/valaBuilder/api';
import { valaJobStore } from '@/lib/valaBuilder/store';
import type { ValaJob } from '@/types/valaBuilder';

const DEFAULT_PROMPT = 'School Management Software';

export default function ValaBuilder() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const jobs = useMemo(() => valaOrchestrator.listJobs(), [refreshToken]);
  const activeJob = useMemo<ValaJob | null>(() => {
    if (!activeJobId) return jobs[0] ?? null;
    return valaJobStore.read(activeJobId) || null;
  }, [jobs, activeJobId, refreshToken]);

  const observability = activeJob ? valaJobStore.getObservability(activeJob.id) : null;

  const refresh = () => setRefreshToken((x) => x + 1);

  const createJob = () => {
    const job = valaOrchestrator.createJob(prompt.trim() || DEFAULT_PROMPT);
    setActiveJobId(job.id);
    refresh();
  };

  const runPipeline = () => {
    if (!activeJob) return;
    valaOrchestrator.runToCompletion(activeJob.id);
    refresh();
  };

  const runScanRepairLoop = () => {
    if (!activeJob) return;
    valaOrchestrator.monitorSelfHealing(activeJob.id, 1);
    refresh();
  };

  const scanApi = activeJob ? postAiScanFull(activeJob.id) : null;
  const deployApi = activeJob && activeJob.latestBuild?.success ? postDeployAuto(activeJob.id) : null;
  const apkStatus = activeJob?.latestApk ? getApkStatus(activeJob.id, activeJob.latestApk.id) : null;

  return (
    <Layout title="Vala Builder" showBack>
      <div className="space-y-4">
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <Bot size={16} />
            <p className="text-sm font-bold">Multi-Agent Software Factory (Incremental)</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Scope is phased for this existing POS app: control-plane simulation, orchestration, diagnostics APIs, self-healing loop,
            deploy/apk lifecycle tracking, and governance.
          </p>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className="w-full min-h-20 rounded-xl border border-border/50 bg-background/70 px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <button onClick={createJob} className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold">
              Create Job
            </button>
            <button
              onClick={runPipeline}
              disabled={!activeJob}
              className="px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold disabled:opacity-50"
            >
              Run Pipeline
            </button>
            <button
              onClick={runScanRepairLoop}
              disabled={!activeJob}
              className="px-3 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-semibold disabled:opacity-50"
            >
              Self-Heal Cycle
            </button>
            <button onClick={refresh} className="px-3 py-2 rounded-xl bg-muted text-foreground text-xs font-semibold">
              Refresh
            </button>
          </div>
        </div>

        {activeJob && (
          <>
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">Active Job</h2>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{activeJob.status}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 break-all">{activeJob.id}</p>
              <p className="text-xs mt-1">Current stage: {activeJob.currentStage ?? 'none'}</p>
              <p className="text-xs mt-1">Retries: {activeJob.retries}</p>
              <p className="text-xs mt-1">Artifacts: {activeJob.artifacts.length}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card p-3">
                <div className="flex items-center gap-2 text-primary mb-2"><Activity size={14} /> <span className="text-xs font-semibold">Observability</span></div>
                <p className="text-[11px]">Completed stages: {observability?.completedStages ?? 0}</p>
                <p className="text-[11px]">Failed stages: {observability?.failedStages ?? 0}</p>
                <p className="text-[11px]">Recent events: {observability?.recentEvents.length ?? 0}</p>
              </div>
              <div className="glass-card p-3">
                <div className="flex items-center gap-2 text-primary mb-2"><ShieldCheck size={14} /> <span className="text-xs font-semibold">Quality</span></div>
                <p className="text-[11px]">UI: {activeJob.quality?.uiComplete ? 'ok' : 'missing'}</p>
                <p className="text-[11px]">API: {activeJob.quality?.apiComplete ? 'ok' : 'missing'}</p>
                <p className="text-[11px]">Auth/Routes: {activeJob.quality?.authWorking && activeJob.quality?.routesWorking ? 'ok' : 'pending'}</p>
              </div>
              <div className="glass-card p-3">
                <div className="flex items-center gap-2 text-primary mb-2"><Wrench size={14} /> <span className="text-xs font-semibold">/ai/scan-full</span></div>
                <p className="text-[11px]">Errors: {scanApi?.errors.length ?? 0}</p>
                <p className="text-[11px]">Warnings: {scanApi?.warnings.length ?? 0}</p>
                <p className="text-[11px]">Fixes: {scanApi?.fix_suggestion.length ?? 0}</p>
              </div>
              <div className="glass-card p-3">
                <div className="flex items-center gap-2 text-primary mb-2"><Rocket size={14} /> <span className="text-xs font-semibold">/deploy/auto</span></div>
                <p className="text-[11px]">Strategy: {deployApi?.deploy.strategy ?? 'blocked'}</p>
                <p className="text-[11px]">Live slot: {deployApi?.deploy.switchedLiveSlot ?? '-'}</p>
                <p className="text-[11px]">Rollback points: {activeJob.rollbackPoints.length}</p>
              </div>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center gap-2 text-primary mb-2"><Smartphone size={14} /> <span className="text-xs font-semibold">/apk/status/:id</span></div>
              <p className="text-xs">Status: {apkStatus?.status ?? 'pending'}</p>
              <p className="text-xs text-muted-foreground mt-1">History: {(apkStatus?.history ?? ['pending']).join(' → ')}</p>
            </div>

            <div className="glass-card p-4">
              <h2 className="text-sm font-bold mb-2">Rollout Strategy</h2>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                <li>Phase 1: orchestration + scan/build/test loop</li>
                <li>Phase 2: auto-repair + partial deploy automation</li>
                <li>Phase 3: full self-healing + APK + blue-green + rollback automation</li>
              </ul>
            </div>
          </>
        )}

        <div className="glass-card p-4">
          <h2 className="text-sm font-bold mb-2">Recent Jobs</h2>
          {jobs.length === 0 ? (
            <p className="text-xs text-muted-foreground">No jobs yet.</p>
          ) : (
            <div className="space-y-2">
              {jobs.slice(0, 5).map((job) => (
                <button
                  key={job.id}
                  onClick={() => {
                    setActiveJobId(job.id);
                    refresh();
                  }}
                  className="w-full text-left rounded-xl border border-border/50 px-3 py-2 hover:bg-muted/40"
                >
                  <div className="flex justify-between">
                    <span className="text-xs font-semibold truncate pr-2">{job.prompt}</span>
                    <span className="text-[10px] text-primary">{job.status}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{job.id}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
