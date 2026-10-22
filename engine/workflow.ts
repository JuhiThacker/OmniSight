```typescript
/**
 * OmniSight - Workflow Definition
 * Describes the browser actions an automation workflow can perform.
 */

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
 * Checks whether an action is supported by OmniSight.
 */
export function isSupportedAction(
  action: string
): action is WorkflowAction {
  const supportedActions: string[] = [
    "goto",
    "click",
    "type",
    "select",
    "wait",
    "extract",
  ];

  return supportedActions.includes(action);
}

/**
 * Checks whether a workflow has the minimum required information.
 * Returns an array of validation errors.
 * An empty array means no errors were found.
 */
export function validateWorkflow(workflow: Workflow): string[] {
  const errors: string[] = [];

  // Validate the workflow name.
  if (!workflow.name.trim()) {
    errors.push("Workflow name is required.");
  }

  // Validate the starting URL.
  if (!workflow.baseUrl.trim()) {
    errors.push("Base URL is required.");
  } else {
    try {
      const url = new URL(workflow.baseUrl);

      if (url.protocol !== "http:" && url.protocol !== "https:") {
        errors.push("Base URL must use HTTP or HTTPS.");
      }
    } catch {
      errors.push("Base URL must be a valid URL.");
    }
  }

  // Ensure that the workflow contains at least one step.
  if (workflow.steps.length === 0) {
    errors.push("At least one workflow step is required.");
  }

  const seenIds = new Set<string>();

  // Validate each workflow step.
  for (const step of workflow.steps) {
    // Check that the action is supported.
    if (!isSupportedAction(step.action)) {
      errors.push(
        `Step ${step.id || "(no ID)"} uses an unsupported action.`
      );
    }

    // Check that every step has a unique ID.
    if (!step.id.trim()) {
      errors.push("Every step must have an ID.");
    } else if (seenIds.has(step.id)) {
      errors.push(`Duplicate step ID: ${step.id}`);
    }

    seenIds.add(step.id);

    // Check that every step has a description.
    if (!step.description.trim()) {
      errors.push(
        `Step ${step.id || "(no ID)"} needs a description.`
      );
    }

    // These actions require a target element.
    const actionsRequiringTarget: WorkflowAction[] = [
      "click",
      "type",
      "select",
      "extract",
    ];

    if (
      actionsRequiringTarget.includes(step.action) &&
      !step.target?.trim()
    ) {
      errors.push(
        `Step ${step.id || "(no ID)"} requires a target for action "${step.action}".`
      );
    }

    // Navigation and typing actions require a value.
    if (
      (step.action === "goto" || step.action === "type") &&
      !step.value?.trim()
    ) {
      errors.push(
        `Step ${step.id || "(no ID)"} requires a value for action "${step.action}".`
      );
    }

    // Validate the destination URL for navigation actions.
    if (step.action === "goto" && step.value?.trim()) {
      try {
        const destination = new URL(step.value);

        if (
          destination.protocol !== "http:" &&
          destination.protocol !== "https:"
        ) {
          errors.push(
            `Step ${step.id || "(no ID)"} destination must use HTTP or HTTPS.`
          );
        }
      } catch {
        errors.push(
          `Step ${step.id || "(no ID)"} must have a valid destination URL.`
        );
      }
    }

    // Wait actions require a non-negative duration in milliseconds.
    if (step.action === "wait") {
      const duration = Number(step.value);

      if (
        !step.value?.trim() ||
        !Number.isFinite(duration) ||
        duration < 0
      ) {
        errors.push(
          `Step ${step.id || "(no ID)"} must have a valid wait duration in milliseconds.`
        );
      }
    }
  }

  return errors;
}

/**
 * Checks whether a workflow is ready for execution.
 * Returns true only when validation finds no errors.
 */
export function isWorkflowReady(workflow: Workflow): boolean {
  return validateWorkflow(workflow).length === 0;
}
```
