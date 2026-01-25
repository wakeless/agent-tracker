import { createServerFn } from '@tanstack/react-start';
import { PlanReader, PlanFile, parsePlanMarkdown, ParsedPlan } from '@agent-tracker/core';

// Serialize a PlanFile to be JSON-safe (convert Date objects to ISO strings)
export interface SerializedPlanFile {
  filename: string;
  path: string;
  title: string;
  modified: string;
  size: number;
}

function serializePlanFile(plan: PlanFile): SerializedPlanFile {
  return {
    ...plan,
    modified: plan.modified.toISOString(),
  };
}

export interface PlansResponse {
  plans: SerializedPlanFile[];
  total: number;
}

export const getPlans = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PlansResponse> => {
    const reader = new PlanReader();
    const plans = reader.scanPlans();

    return {
      plans: plans.map(serializePlanFile),
      total: plans.length,
    };
  }
);

export interface PlanContentResponse {
  content: string | null;
  parsed: ParsedPlan | null;
  filename: string;
}

export const getPlan = createServerFn({ method: 'GET' }).handler(
  async (ctx: { data: string }): Promise<PlanContentResponse> => {
    const filename = ctx.data;
    const reader = new PlanReader();
    const content = reader.readPlan(filename);

    return {
      content,
      parsed: content ? parsePlanMarkdown(content) : null,
      filename,
    };
  }
);
