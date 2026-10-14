

 * OmniSight - Workflow Definition *
 * Describes the browser actions an automation workflow can perform.
 

export type WorkflowAction =
  | "goto"
  | "click"
  | "type"
  | "select"
  | "wait"
  | "extract";

export interface WorkflowStep {
  id: string;
  action: WorkflowAction;
  description: string;
  target?: string;
  value?: string;
  expectedText?: string;
}

export interface Workflow {
  name: string;
  baseUrl: string;
  steps: WorkflowStep[];
}

/**
 * Checks whether a workflow has the minimum required information.
 */
export function validateWorkflow(
  workflow: Workflow
): string[] {
  const errors: string[] = [];

  if (!workflow.name.trim()) {
    errors.push("Workflow name is required.");
  }

  if (!workflow.baseUrl.trim()) {
    errors.push("Base URL is required.");
  }

  if (workflow.steps.length === 0) {
    errors.push("At least one workflow step is required.");
  }

  const seenIds = new Set<string>();

  for (const step of workflow.steps) {
    if (!step.id.trim()) {
      errors.push("Every step must have an ID.");
    } else if (seenIds.has(step.id)) {
      errors.push(`Duplicate step ID: ${step.id}`);
    }

    seenIds.add(step.id);

    if (!step.description.trim()) {
      errors.push(`Step ${step.id || "(no ID)"} needs a description.`);
    }
  }

  return errors;
}
