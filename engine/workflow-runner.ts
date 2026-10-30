/**
 * OmniSight - Workflow Runner
 * Executes browser workflows using Playwright.
 * Validates steps and generates a JSON execution report.
 */

import { chromium, type Page } from "playwright";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { validateWorkflow } from "./workflow";

type WorkflowAction =
  | "goto"
  | "click"
  | "type"
  | "select"
  | "wait"
  | "extract";

interface WorkflowStep {
  id: string;
  action: WorkflowAction;
  description: string;
  target?: string;
  value?: string;
  expectedText?: string;
}

interface Workflow {
  name: string;
  baseUrl: string;
  steps: WorkflowStep[];
}

interface StepResult {
  stepId: string;
  description: string;
  action: string;
  status: "PASSED" | "FAILED";
  message: string;
  durationMs: number;
}

interface WorkflowReport {
  workflowName: string;
  status: "PASSED" | "FAILED";
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  startedAt: string;
  completedAt: string;
  results: StepResult[];
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Executes one workflow step.
 */
async function executeStep(
  page: Page,
  step: WorkflowStep
): Promise<string> {
  switch (step.action) {
    case "goto": {
      if (!step.value) {
        throw new Error("The goto action requires a URL in value.");
      }

      const destination = new URL(step.value);

      if (!["http:", "https:"].includes(destination.protocol)) {
        throw new Error("Only HTTP and HTTPS URLs are supported.");
      }

      await page.goto(destination.toString(), {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });

      return `Opened ${destination.toString()}`;
    }

    case "click": {
      if (!step.target) {
        throw new Error("The click action requires a target selector.");
      }

      await page.locator(step.target).click({ timeout: 10000 });

      return `Clicked element: ${step.target}`;
    }

    case "type": {
      if (!step.target) {
        throw new Error("The type action requires a target selector.");
      }

      if (step.value === undefined) {
        throw new Error("The type action requires a value.");
      }

      await page.locator(step.target).fill(step.value, {
        timeout: 10000,
      });

      return `Entered text into: ${step.target}`;
    }

    case "select": {
      if (!step.target) {
        throw new Error("The select action requires a target selector.");
      }

      if (step.value === undefined) {
        throw new Error("The select action requires a value.");
      }

      await page.locator(step.target).selectOption(step.value, {
        timeout: 10000,
      });

      return `Selected "${step.value}" in ${step.target}`;
    }

    case "wait": {
      const duration = Number(step.value ?? "1000");

      if (!Number.isFinite(duration) || duration < 0) {
        throw new Error("Wait duration must be a non-negative number.");
      }

      await page.waitForTimeout(duration);

      return `Waited ${duration} milliseconds`;
    }

    case "extract": {
      if (!step.target) {
        throw new Error("The extract action requires a target selector.");
      }

      // Special target "title" extracts the browser page title.
      if (step.target === "title") {
        const title = await page.title();

        if (!title) {
          throw new Error("The page title is empty.");
        }

        return title;
      }

      const extractedText = await page
        .locator(step.target)
        .innerText({ timeout: 10000 });

      if (!extractedText.trim()) {
        throw new Error(
          `No text was found in the element: ${step.target}`
        );
      }

      return extractedText;
    }

    default: {
      const unsupportedAction: never = step.action;
      throw new Error(`Unsupported action: ${unsupportedAction}`);
    }
  }
}

/**
 * Runs the complete workflow and records the results.
 */
async function runWorkflow(workflow: Workflow): Promise<WorkflowReport> {
  const browser = await chromium.launch({ headless: true });

  const page = await browser.newPage();

  page.setDefaultTimeout(10000);

  const results: StepResult[] = [];
  const startedAt = new Date().toISOString();

  try {
    for (const step of workflow.steps) {
      const stepStarted = Date.now();

      try {
        const actualResult = await executeStep(page, step);

        // Check whether the expected text is present.
        if (step.expectedText) {
          if (!actualResult.includes(step.expectedText)) {
            throw new Error(
              `Expected text "${step.expectedText}" was not found. ` +
                `Actual result: "${actualResult.slice(0, 200)}"`
            );
          }
        }

        results.push({
          stepId: step.id,
          description: step.description,
          action: step.action,
          status: "PASSED",
          message: step.expectedText
            ? `Action completed and expected text "${step.expectedText}" was found.`
            : actualResult.slice(0, 300),
          durationMs: Date.now() - stepStarted,
        });

        console.log(`PASSED: ${step.id} - ${step.description}`);
      } catch (error: unknown) {
        const message = getErrorMessage(error);

        results.push({
          stepId: step.id,
          description: step.description,
          action: step.action,
          status: "FAILED",
          message,
          durationMs: Date.now() - stepStarted,
        });

        console.error(`FAILED: ${step.id} - ${message}`);
      }
    }
  } finally {
    await browser.close();
  }

  const passedSteps = results.filter(
    (result) => result.status === "PASSED"
  ).length;

  const failedSteps = results.filter(
    (result) => result.status === "FAILED"
  ).length;

  return {
    workflowName: workflow.name,
    status: failedSteps === 0 ? "PASSED" : "FAILED",
    totalSteps: results.length,
    passedSteps,
    failedSteps,
    startedAt,
    completedAt: new Date().toISOString(),
    results,
  };
}

/**
 * Loads, validates, and executes a workflow JSON file.
 */
async function main(): Promise<void> {
  const workflowPath = process.argv[2];

  if (!workflowPath) {
    console.error(
      "Usage: npx tsx engine/workflow-runner.ts <workflow.json>"
    );
    process.exitCode = 1;
    return;
  }

  const absoluteWorkflowPath = path.resolve(workflowPath);

  let workflow: Workflow;

  try {
    const fileContent = await readFile(absoluteWorkflowPath, "utf-8");
    workflow = JSON.parse(fileContent) as Workflow;
  } catch (error: unknown) {
    console.error(
      `Could not load workflow file: ${getErrorMessage(error)}`
    );
    process.exitCode = 1;
    return;
  }

  // Validate the workflow before opening a browser.
  const validationResult = validateWorkflow(workflow);

  if (validationResult.length > 0) {
    console.error("Workflow validation failed:");
    console.error(
      Array.isArray(validationResult)
        ? validationResult
        : "The workflow is invalid."
    );

    process.exitCode = 1;
    return;
  }

  console.log(`Starting workflow: ${workflow.name}`);

  let report: WorkflowReport;

  try {
    report = await runWorkflow(workflow);
  } catch (error: unknown) {
    console.error(`Workflow execution error: ${getErrorMessage(error)}`);
    process.exitCode = 1;
    return;
  }

  const reportsDirectory = path.resolve("reports");

  await mkdir(reportsDirectory, { recursive: true });

  const reportPath = path.join(
    reportsDirectory,
    "latest-workflow-report.json"
  );

  await writeFile(reportPath, JSON.stringify(report, null, 2), "utf-8");

  console.log("\n=== OmniSight Workflow Report ===");
  console.log(`Workflow: ${report.workflowName}`);
  console.log(`Status: ${report.status}`);
  console.log(`Total steps: ${report.totalSteps}`);
  console.log(`Passed: ${report.passedSteps}`);
  console.log(`Failed: ${report.failedSteps}`);
  console.log(`Report saved to ${reportPath}`);

  if (report.status === "FAILED") {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(`Unexpected error: ${getErrorMessage(error)}`);
  process.exitCode = 1;
});
