# OmniSight – UI Automation and Intelligent Failure Detection

## 1. Project Overview

OmniSight is a browser UI automation and failure detection project developed using TypeScript and Playwright.

The project combines browser workflow automation, responsive UI testing, AI-based visual analysis, CSS safety validation, and controlled UI self-healing.

It aims to identify UI problems, detect workflow failures, collect screenshots as evidence, and demonstrate how approved CSS corrections can resolve responsive layout issues.

## 2. Key Features

### 2.1 Workflow Validation

- Validates workflow names and base URLs.
- Checks whether workflow steps are present and correctly configured.
- Detects duplicate step IDs and unsupported actions.
- Checks required targets, values, navigation URLs, and wait durations.
- Provides validation errors for invalid workflow definitions.

### 2.2 Workflow Execution

- Uses Playwright to execute browser automation workflows.
- Supports six actions: `goto`, `click`, `type`, `select`, `wait`, and `extract`.
- Checks extracted webpage content against expected text.
- Records the execution status and duration of individual workflow steps.
- Continues executing subsequent steps when an individual step fails.
- Automatically captures screenshots when workflow steps fail.
- Generates JSON execution reports containing passed steps, failed steps, error messages, and screenshot paths.

### 2.3 Responsive UI Testing

- Uses Playwright to open a sample shopping webpage.
- Captures desktop and mobile screenshots.
- Measures page dimensions and detects horizontal overflow.
- Generates responsive test reports.

### 2.4 AI-Based UI Analysis

- Uses Google's Gemini AI model to analyse webpage screenshots and HTML.
- Identifies potential UI issues.
- Produces structured analysis containing issue descriptions, severity, evidence, likely causes, and suggested CSS.

### 2.5 CSS Safety Validation

- Checks suggested CSS against a restricted allowlist.
- Accepts approved responsive corrections.
- Rejects unsupported selectors, properties, values, and potentially unsafe CSS patterns.
- Prevents unapproved CSS suggestions from being applied by the demonstration.

### 2.6 Responsive UI Self-Healing Demonstration

- Captures the original mobile layout.
- Analyses the issue using Gemini.
- Validates the suggested CSS.
- Applies an approved correction using Playwright.
- Captures the corrected layout.
- Generates a report to verify whether the correction resolved the issue.

## 3. Technologies Used

| Technology | Purpose |
|---|---|
| TypeScript | Main programming language |
| Node.js | Runtime environment |
| Playwright | Browser automation and UI testing |
| Google Gemini AI | Visual UI analysis and CSS suggestions |
| HTML | Sample webpage |
| CSS | Responsive layout and UI correction |
| JSON | Workflow configuration and test reports |
| Git and GitHub | Version control and project management |

## 4. Project Structure

```text
OmniSight/
│
├── demo/
│   ├── analyze-ui-structured.ts
│   ├── analyze-ui-with-gemini.ts
│   ├── capture-responsive.ts
│   ├── css-safety.ts
│   ├── css-safety.test.ts
│   ├── gemini-self-heal.ts
│   ├── index.html
│   ├── self-heal-responsive.ts
│   ├── validate-ai-css.ts
│   ├── verify-gemini-self-healing-report.ts
│   ├── verify-responsive-report.ts
│   └── verify-self-healing-report.ts
│
├── engine/
│   ├── workflow.ts
│   ├── workflow.test.ts
│   └── workflow-runner.ts
│
├── workflows/
│   ├── ui-failure-demo.json
│   └── ui-failure-test.json
│
├── docs/
│   ├── ui-failure-research.md
│   ├── workflow-validation.md
│   └── workflow-validation-test-coverage.md
│
├── reports/
│   ├── ai-analysis/
│   ├── failures/
│   ├── gemini-self-healing/
│   ├── responsive/
│   └── self-healing/
│
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

## 5. Workflow Automation

The workflow engine uses JSON files to describe browser automation tasks.

Each workflow contains:
- Workflow name
- Base URL
- Steps
- Action type
- Description
- Optional target and value
- Optional expected text

### Supported Actions

| Action | Purpose |
|---|---|
| `goto` | Opens a webpage |
| `click` | Clicks an element |
| `type` | Enters text into an element |
| `select` | Selects an option |
| `wait` | Waits for a specified duration |
| `extract` | Extracts webpage content or title |

### Workflow Execution Process

1. Loads the workflow JSON file.
2. Validates the workflow configuration.
3. Launches the Chromium browser using Playwright.
4. Executes workflow steps.
5. Checks expected text when provided.
6. Records successful and failed steps.
7. Captures a screenshot when a step fails.
8. Generates a JSON execution report.

### Successful Workflow Test

The file `workflows/ui-failure-demo.json` was executed.

Recorded result:
- Total steps: 3
- Passed steps: 3
- Failed steps: 0
- Overall status: PASSED

The workflow successfully opened Example Domain, extracted webpage content, and verified the page title.

### Failure Detection Test

The file `workflows/ui-failure-test.json` was executed with deliberately incorrect expected text.

Recorded result:
- Total steps: 3
- Passed steps: 2
- Failed steps: 1
- Overall status: FAILED

The system correctly detected the missing expected text, captured a screenshot, and continued executing the third step.

The failure screenshot was saved under:

`reports/failures/`

The execution report was saved as:

`reports/latest-workflow-report.json`

## 6. Responsive UI Analysis and Self-Healing

The responsive UI demonstration uses a sample shopping webpage to identify layout problems.

One demonstrated issue was horizontal overflow on a mobile viewport.

The original layout had:
- Mobile viewport width: 390 pixels
- Document width: 685 pixels
- Checkout button width: 650 pixels

Gemini identified the oversized checkout element and suggested a responsive CSS correction.

The suggested correction was checked using the CSS safety validation module before being applied.

The validated correction reduced the document width to 390 pixels and resolved the demonstrated horizontal overflow.

## 7. AI Integration

OmniSight uses Google's Gemini AI through the `@google/genai` package.

The AI analysis process:
1. Captures a webpage screenshot.
2. Collects relevant HTML.
3. Sends the information for analysis.
4. Receives structured UI issue information.
5. Identifies a possible correction.
6. Passes the suggested CSS through the safety validation module.
7. Applies the correction only when approved.

The Gemini API key is configured through the `GEMINI_API_KEY` environment variable.

**Security note:** Do not commit API keys or other secrets to GitHub.

## 8. Installation and Setup

### Prerequisites

- Node.js
- npm
- Git
- Visual Studio Code or another code editor

### Install Dependencies

```bash
npm install
```

### Install Playwright Chromium

```bash
npx playwright install chromium
```

### Configure Gemini API Access

Set the `GEMINI_API_KEY` environment variable before running Gemini-based demonstrations.

Do not share the key publicly or upload it to GitHub.

## 9. Running the Project

### TypeScript Type Checking

```bash
npm run typecheck
```

### Workflow Validation Tests

```bash
npx tsx engine/workflow.test.ts
```

### Successful Workflow Execution

```bash
npx tsx engine/workflow-runner.ts workflows/ui-failure-demo.json
```

### Failure Detection Workflow

```bash
npx tsx engine/workflow-runner.ts workflows/ui-failure-test.json
```

### CSS Safety Tests

```bash
npx tsx demo/css-safety.test.ts
```

### Gemini Self-Healing Report Verification

```bash
npx tsx demo/verify-gemini-self-healing-report.ts
```

### Run the Gemini Self-Healing Demonstration

```bash
npx tsx demo/gemini-self-heal.ts
```

The Gemini demonstration requires valid API access.

## 10. Testing Status

The following results have been recorded during development:

| Test | Recorded Result |
|---|---|
| Workflow validation | 12/12 passing |
| Successful workflow execution | 3/3 steps passed |
| Full interaction workflow execution | 6/6 steps passed |
| Interaction workflow report | reports/interaction-workflow-report.json |
| Workflow failure detection | 1 failure correctly detected |
| Execution continuation after failure | Verified |
| Failure screenshot capture | Screenshot generated successfully |
| CSS safety validation | 7/7 passing |
| Gemini self-healing report verification | 6/6 passing |
| TypeScript type checking | No errors |

These are recorded local test results. Run the relevant commands again after making code changes.

## 11. Current Scope and Limitations

- Browser workflow execution has been demonstrated using successful and deliberately failing workflows.
- All six workflow actions (`goto`, `click`, `type`, `select`, `wait`, and `extract`) have been exercised successfully in browser workflow tests.
- The documented UI failure scenarios are research and proposed test cases; not all have been executed.
- The current Gemini self-healing demonstration focuses on a specific responsive checkout-width issue.
- CSS safety validation uses a restricted allowlist and is not a complete CSS security system.
- The demonstration does not establish automatic repair for every type of website failure.

## 12. Future Enhancements

- Expand browser workflow testing across different websites and more complex interactions.
- Expand browser workflow testing across different websites.
- Add more UI failure detection scenarios.
- Improve screenshot comparison and visual regression testing.
- Improve AI-based issue classification.
- Expand the range of safe responsive CSS corrections.
- Improve workflow reporting and debugging.
- Add a graphical interface for creating and monitoring workflows.

## 13. Conclusion

OmniSight combines browser automation, workflow validation, responsive UI testing, AI-based visual analysis, and controlled CSS correction in a practical UI testing demonstration.

The project demonstrates how Playwright can automate browser workflows, detect failures, capture screenshots, and generate execution reports. It also demonstrates how Gemini AI and CSS safety validation can work together to identify and correct a specific responsive UI problem.

OmniSight provides a foundation for further development of intelligent UI automation and failure detection systems.
