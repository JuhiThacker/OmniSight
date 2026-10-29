# Workflow Validation Test Coverage

## 1. Purpose

Workflow validation checks whether a workflow definition contains the information needed before it is executed. These checks help identify configuration problems early and make errors easier to understand.

## 2. Validation Rules

The current workflow validator checks the following conditions:

- The workflow name must not be empty.
- The base URL must be provided and must be a valid HTTP or HTTPS URL.
- A workflow must contain at least one step.
- Every step must have a non-empty ID.
- Step IDs must be unique.
- Every step must have a description.
- Supported actions are `goto`, `click`, `type`, `select`, `wait`, and `extract`.
- Actions that require a target must have one.
- `goto` and `type` actions must have a value.
- Navigation destinations must be valid HTTP or HTTPS URLs.
- Wait durations must be present, numeric, finite, and non-negative.

## 3. Automated Test Coverage

The workflow validation test file covers valid workflows and invalid configurations.

The tests cover:

1. A valid workflow.
2. A missing workflow name.
3. An invalid base URL.
4. Missing workflow steps.
5. Duplicate step IDs.
6. A missing target.
7. A missing typing value.
8. An unsupported action.
9. An invalid navigation destination URL.
10. An unsupported navigation protocol.
11. A negative wait duration.
12. A non-numeric wait duration.

## 4. Verification

The test command used is:

`npx tsx engine/workflow.test.ts`

The latest local test run completed with **12 out of 12 tests passing**.

The TypeScript check can be run using:

`npm run typecheck`

## 5. Benefits

These validation checks help detect configuration errors before workflow execution. The tests also provide regression coverage, helping identify if future code changes break existing validation behavior.

## 6. Future Improvements

Potential improvements include testing missing step descriptions, empty step IDs, duplicate IDs, invalid wait values, and integration with the browser workflow execution process. The execution process should also be tested separately from workflow definition validation.
