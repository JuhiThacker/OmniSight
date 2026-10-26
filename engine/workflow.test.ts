```typescript
import {
  isWorkflowReady,
  validateWorkflow,
  type Workflow,
} from "./workflow";

function createValidWorkflow(): Workflow {
  return {
    name: "Login Workflow",
    baseUrl: "https://example.com",
    steps: [
      {
        id: "step-1",
        action: "goto",
        description: "Open the website",
        value: "https://example.com",
      },
      {
        id: "step-2",
        action: "type",
        description: "Enter the username",
        target: "#username",
        value: "test-user",
      },
      {
        id: "step-3",
        action: "click",
        description: "Click the login button",
        target: "#login-button",
      },
    ],
  };
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Test failed: ${message}`);
  }
}

function testValidWorkflow(): void {
  const workflow = createValidWorkflow();

  assert(
    validateWorkflow(workflow).length === 0,
    "A valid workflow should have no validation errors."
  );

  assert(
    isWorkflowReady(workflow),
    "A valid workflow should be ready for execution."
  );
}

function testMissingWorkflowName(): void {
  const workflow = createValidWorkflow();
  workflow.name = "";

  assert(
    validateWorkflow(workflow).some((error) =>
      error.includes("Workflow name is required")
    ),
    "A missing workflow name should produce an error."
  );
}

function testInvalidBaseUrl(): void {
  const workflow = createValidWorkflow();
  workflow.baseUrl = "not-a-valid-url";

  assert(
    validateWorkflow(workflow).some((error) =>
      error.includes("Base URL must be a valid URL")
    ),
    "An invalid base URL should produce an error."
  );
}

function testMissingSteps(): void {
  const workflow = createValidWorkflow();
  workflow.steps = [];

  assert(
    validateWorkflow(workflow).some((error) =>
      error.includes("At least one workflow step is required")
    ),
    "A workflow without steps should produce an error."
  );
}

function testDuplicateStepIds(): void {
  const workflow = createValidWorkflow();
  workflow.steps[1].id = workflow.steps[0].id;

  assert(
    validateWorkflow(workflow).some((error) =>
      error.includes("Duplicate step ID")
    ),
    "Duplicate step IDs should produce an error."
  );
}

function testMissingTarget(): void {
  const workflow = createValidWorkflow();
  workflow.steps[1].target = "";

  assert(
    validateWorkflow(workflow).some((error) =>
      error.includes("requires a target")
    ),
    "A type action without a target should produce an error."
  );
}

function testMissingTypingValue(): void {
  const workflow = createValidWorkflow();
  workflow.steps[1].value = "";

  assert(
    validateWorkflow(workflow).some((error) =>
      error.includes('requires a value for action "type"')
    ),
    "A type action without a value should produce an error."
  );
}

function testUnsupportedAction(): void {
  const workflow = createValidWorkflow();

  workflow.steps[0].action =
    "invalid-action" as Workflow["steps"][number]["action"];

  assert(
    validateWorkflow(workflow).some((error) =>
      error.includes("unsupported action")
    ),
    "An unsupported action should produce an error."
  );
}

function runWorkflowValidationTests(): void {
  const tests: Array<[string, () => void]> = [
    ["Valid workflow", testValidWorkflow],
    ["Missing workflow name", testMissingWorkflowName],
    ["Invalid base URL", testInvalidBaseUrl],
    ["Missing workflow steps", testMissingSteps],
    ["Duplicate step IDs", testDuplicateStepIds],
    ["Missing action target", testMissingTarget],
    ["Missing typing value", testMissingTypingValue],
    ["Unsupported action", testUnsupportedAction],
  ];

  let passed = 0;

  for (const [name, test] of tests) {
    test();
    passed++;
    console.log(`PASS: ${name}`);
  }

  console.log(
    `\n${passed}/${tests.length} workflow validation tests passed.`
  );
}

runWorkflowValidationTests();
```
