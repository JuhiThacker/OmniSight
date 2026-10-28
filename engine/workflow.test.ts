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

// Test 1: A valid workflow should pass validation.
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

// Test 2: A missing workflow name should produce an error.
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

// Test 3: An invalid base URL should produce an error.
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

// Test 4: A workflow without steps should produce an error.
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

// Test 5: Duplicate step IDs should produce an error.
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

// Test 6: A required target must not be empty.
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

// Test 7: A typing action must have a value.
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

// Test 8: An unsupported action should produce an error.
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

// Test 9: An invalid navigation URL should produce an error.
function testInvalidNavigationUrl(): void {
  const workflow = createValidWorkflow();
  workflow.steps[0].value = "not-a-valid-url";

  assert(
    validateWorkflow(workflow).some((error) =>
      error.includes("must have a valid destination URL")
    ),
    "An invalid navigation URL should produce an error."
  );
}

// Test 10: A navigation URL using an unsupported protocol should fail.
function testUnsupportedNavigationProtocol(): void {
  const workflow = createValidWorkflow();
  workflow.steps[0].value = "ftp://example.com";

  assert(
    validateWorkflow(workflow).some((error) =>
      error.includes("destination must use HTTP or HTTPS")
    ),
    "A navigation URL using FTP should produce an error."
  );
}

// Test 11: A negative wait duration should produce an error.
function testNegativeWaitDuration(): void {
  const workflow = createValidWorkflow();

  workflow.steps.push({
    id: "step-4",
    action: "wait",
    description: "Wait for the page to load",
    value: "-100",
  });

  assert(
    validateWorkflow(workflow).some((error) =>
      error.includes("must have a valid wait duration")
    ),
    "A negative wait duration should produce an error."
  );
}

// Test 12: A non-numeric wait duration should produce an error.
function testNonNumericWaitDuration(): void {
  const workflow = createValidWorkflow();

  workflow.steps.push({
    id: "step-4",
    action: "wait",
    description: "Wait for the page to load",
    value: "abc",
  });

  assert(
    validateWorkflow(workflow).some((error) =>
      error.includes("must have a valid wait duration")
    ),
    "A non-numeric wait duration should produce an error."
  );
}

// Run all workflow validation tests.
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
    ["Invalid navigation URL", testInvalidNavigationUrl],
    [
      "Unsupported navigation protocol",
      testUnsupportedNavigationProtocol,
    ],
    ["Negative wait duration", testNegativeWaitDuration],
    ["Non-numeric wait duration", testNonNumericWaitDuration],
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
