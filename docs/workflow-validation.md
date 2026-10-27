# OmniSight Workflow Validation

## 1. Overview

Workflow validation checks whether a browser automation workflow contains the information required for execution. It helps identify configuration problems before the workflow is used.

The validation logic is implemented in `engine/workflow.ts`, and its current test cases are in `engine/workflow.test.ts`.

## 2. Supported Workflow Actions

OmniSight currently defines the following workflow actions:

- `goto` — Navigate to a destination URL.
- `click` — Interact with a target element.
- `type` — Enter a value into a target element.
- `select` — Select an option from a target element.
- `wait` — Wait for a specified duration.
- `extract` — Extract information from a target element.

These action definitions describe supported workflow operations. Defining an action does not, by itself, mean that its browser execution has been implemented.

## 3. Workflow Structure

A workflow contains three main properties:

- `name` — Identifies the workflow.
- `baseUrl` — Specifies the workflow's base URL.
- `steps` — Contains the ordered list of workflow steps.

Each step includes an ID, an action, and a description. Depending on the action, it may also contain a target, value, or expected text.

## 4. Validation Checks

The current validation logic checks for:

- A non-empty workflow name.
- A valid HTTP or HTTPS base URL.
- At least one workflow step.
- Supported action names.
- Non-empty step IDs.
- Duplicate step IDs.
- Non-empty step descriptions.
- Required targets for applicable actions.
- Required values for navigation and typing actions.
- Valid HTTP or HTTPS destination URLs for navigation steps.
- Valid, non-negative wait durations in milliseconds.

Validation errors are returned as an array of messages.

## 5. Readiness Check

The `isWorkflowReady()` function determines whether a workflow passes the current validation rules.

It returns `true` when validation produces no errors and `false` when one or more errors are found.

## 6. Testing

Workflow validation tests are maintained in `engine/workflow.test.ts`.

The test suite covers valid workflows, missing names, invalid base URLs, missing steps, duplicate step IDs, missing targets, missing typing values, and unsupported actions.

Run the following commands from the project directory:

```bash
npm run typecheck
npx tsx engine/workflow.test.ts
```

The expected test result is eight passing tests, provided the current test suite has not changed.

## 7. Limitations

Passing validation confirms that a workflow satisfies the implemented configuration checks. It does not prove that a website is accessible, that selectors match real elements, or that every browser action will execute successfully.

Further work could include browser execution tests, additional edge-case tests, and clearer error reporting.

## 8. Conclusion

Workflow validation provides an initial quality check for OmniSight's browser automation definitions. Keeping the validation rules documented makes the code easier to understand, test, and maintain.
