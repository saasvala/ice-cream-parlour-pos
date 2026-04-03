import type { AgentStageOutput, StageExecution, ValaAgentId } from '@/types/valaBuilder';

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

export interface StageInputEnvelope {
  prompt: string;
  upstreamOutputs: Partial<Record<ValaAgentId, AgentStageOutput>>;
}

export interface StageResult {
  success: boolean;
  output?: AgentStageOutput;
  error?: string;
}

export class AgentExecutor {
  execute(stage: StageExecution, input: StageInputEnvelope): StageResult {
    const contextKeys = Object.keys(input.upstreamOutputs);
    const summary = `${stage.id} processed prompt with ${contextKeys.length} prior stage outputs`;

    const payload: Record<string, unknown> = {
      stage: stage.id,
      promptLength: input.prompt.length,
      upstreamStageCount: contextKeys.length,
      inputs: stage.contract.input,
      outputs: stage.contract.output,
      handoffTo: stage.contract.handoffTo ?? null,
      timestamp: new Date().toISOString(),
    };

    if (!isStringArray(stage.contract.input) || !isStringArray(stage.contract.output)) {
      return {
        success: false,
        error: `Invalid stage contract for ${stage.id}`,
      };
    }

    return {
      success: true,
      output: {
        summary,
        payload,
        artifacts: [`memory://agent/${stage.id}/${Date.now()}`],
        metrics: {
          inputTokensEstimate: input.prompt.split(/\s+/).filter(Boolean).length,
          outputKeys: Object.keys(payload).length,
        },
      },
    };
  }
}

export const agentExecutor = new AgentExecutor();
