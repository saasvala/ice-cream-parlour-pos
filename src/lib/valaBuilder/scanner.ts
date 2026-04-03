import type { ScanIssue, ScanReport, ValaJob } from '@/types/valaBuilder';

function createIssue(
  category: ScanIssue['category'],
  severity: ScanIssue['severity'],
  message: string,
  fixSuggestion: string,
): ScanIssue {
  return {
    id: `${category}_${severity}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    category,
    severity,
    message,
    fixSuggestion,
  };
}

export interface ScanFullResponse {
  errors: ScanIssue[];
  warnings: ScanIssue[];
  fix_suggestion: string[];
}

export class ScanEngine {
  runFullScan(job: ValaJob): ScanReport {
    const issues: ScanIssue[] = [];

    if (!job.outputs.integrator) {
      issues.push(createIssue('api', 'error', 'Integration output missing', 'Re-run integrator stage and re-sync contracts'));
    }

    if (!job.outputs.tester) {
      issues.push(createIssue('routes', 'error', 'Route validation missing', 'Run tester stage for end-to-end route checks'));
    }

    if (job.governance.retryCount > 0) {
      issues.push(createIssue('performance', 'warning', 'Retry attempts detected', 'Inspect failing stage logs and optimize stage contracts'));
    }

    const errors = issues.filter((i) => i.severity === 'error');
    const warnings = issues.filter((i) => i.severity === 'warning');

    return {
      id: `scan_${Date.now().toString(36)}`,
      jobId: job.id,
      createdAt: new Date().toISOString(),
      errors,
      warnings,
      fix_suggestion: issues.map((issue) => issue.fixSuggestion),
    };
  }

  asApiResponse(report: ScanReport): ScanFullResponse {
    return {
      errors: report.errors,
      warnings: report.warnings,
      fix_suggestion: report.fix_suggestion,
    };
  }
}

export const scanEngine = new ScanEngine();
