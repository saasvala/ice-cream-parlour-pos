import type { ScanReport, ValaJob } from '@/types/valaBuilder';

export interface RepairAction {
  id: string;
  issueId: string;
  applied: boolean;
  note: string;
}

export interface RepairOutcome {
  actions: RepairAction[];
  needsRetest: boolean;
}

export class RepairEngine {
  applyRepair(job: ValaJob, report: ScanReport): RepairOutcome {
    const actions = [...report.errors, ...report.warnings].map((issue) => ({
      id: `repair_${issue.id}`,
      issueId: issue.id,
      applied: true,
      note: `Debugger routed fix for ${issue.category}: ${issue.fixSuggestion}`,
    }));

    if (actions.length > 0) {
      job.governance.repairCycles += 1;
    }

    return {
      actions,
      needsRetest: report.errors.length > 0,
    };
  }
}

export const repairEngine = new RepairEngine();
