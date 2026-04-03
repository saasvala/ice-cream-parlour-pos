import type { StageExecution, ValaAgentId } from '@/types/valaBuilder';

export const PIPELINE_ORDER: ValaAgentId[] = [
  'planner',
  'architect',
  'ui_builder',
  'backend_dev',
  'db_engineer',
  'integrator',
  'debugger',
  'tester',
  'optimizer',
  'deployer',
];

const HANDOFF: Record<ValaAgentId, ValaAgentId | undefined> = {
  planner: 'architect',
  architect: 'ui_builder',
  ui_builder: 'backend_dev',
  backend_dev: 'db_engineer',
  db_engineer: 'integrator',
  integrator: 'debugger',
  debugger: 'tester',
  tester: 'optimizer',
  optimizer: 'deployer',
  deployer: undefined,
};

function createContract(stage: ValaAgentId) {
  return {
    input: [`${stage}_input_context`],
    output: [`${stage}_output_summary`, `${stage}_structured_payload`],
    handoffTo: HANDOFF[stage],
  };
}

export function createPipelineStages(maxAttempts: number): StageExecution[] {
  return PIPELINE_ORDER.map((stage) => ({
    id: stage,
    status: 'pending',
    attempts: 0,
    maxAttempts,
    contract: createContract(stage),
  }));
}

export function getStageIndex(stage: ValaAgentId) {
  return PIPELINE_ORDER.indexOf(stage);
}

export function getNextStage(stage: ValaAgentId): ValaAgentId | null {
  const idx = getStageIndex(stage);
  if (idx < 0 || idx >= PIPELINE_ORDER.length - 1) {
    return null;
  }
  return PIPELINE_ORDER[idx + 1];
}
