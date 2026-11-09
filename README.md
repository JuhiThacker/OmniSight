\# OmniSight – UI Automation and Intelligent Failure Detection



\## 1. Project Overview



OmniSight is a browser UI automation and failure detection project developed using TypeScript and Playwright.



The project focuses on validating browser automation workflows, identifying responsive UI problems, analysing screenshots with Google's Gemini AI, and safely applying approved CSS corrections in a controlled demonstration.



Its goal is to make UI testing more reliable by combining browser automation, structured analysis, validation, and test evidence.



\## 2. Key Features



\### Workflow Validation

\- Validates workflow names and base URLs.

\- Checks whether workflow steps are present and correctly configured.

\- Detects duplicate step IDs and unsupported actions.

\- Checks required targets, values, navigation URLs, and wait durations.

\- Provides validation errors for invalid workflow definitions.



\### Responsive UI Testing

\- Uses Playwright to open a sample shopping webpage.

\- Captures desktop and mobile screenshots.

\- Measures page dimensions and detects horizontal overflow.

\- Generates responsive test reports.



\### AI-Based UI Analysis

\- Uses Google's Gemini model to analyse a webpage screenshot and HTML.

\- Identifies potential UI issues.

\- Produces structured analysis containing issue descriptions, severity, evidence, likely causes, and suggested CSS.



\### CSS Safety Validation

\- Checks suggested CSS against an allowlist.

\- Accepts approved responsive corrections.

\- Rejects unsupported selectors, properties, values, and potentially unsafe CSS patterns.

\- Prevents unapproved CSS suggestions from being applied by the demonstration.



\### Responsive UI Self-Healing Demonstration

\- Captures the original mobile layout.

\- Analyses the issue using Gemini.

\- Validates the suggested CSS.

\- Applies an approved correction using Playwright.

\- Captures the corrected layout.

\- Generates a report to verify the result.



\## 3. Technologies Used



| Technology | Purpose |

|---|---|

| TypeScript | Main programming language |

| Node.js | Runtime environment |

| Playwright | Browser automation and screenshots |

| Google Gemini API | AI-based visual UI analysis |

| CSS | Responsive UI correction |

| tsx | Running TypeScript files |

| Git and GitHub | Version control and project hosting |



\## 4. Project Structure



```text

OmniSight/

│

├── demo/

│   ├── index.html

│   ├── capture-responsive.ts

│   ├── analyze-ui-structured.ts

│   ├── analyze-ui-with-gemini.ts

│   ├── css-safety.ts

│   ├── css-safety.test.ts

│   ├── validate-ai-css.ts

│   ├── self-heal-responsive.ts

│   ├── gemini-self-heal.ts

│   ├── verify-self-healing-report.ts

│   └── verify-gemini-self-healing-report.ts

│

├── engine/

│   ├── workflow.ts

│   └── workflow.test.ts

│

├── workflows/

│

├── docs/

│   ├── ui-failure-research.md

│   ├── workflow-validation.md

│   └── workflow-validation-test-coverage.md

│

├── reports/

│   ├── responsive/

│   ├── ai-analysis/

│   ├── self-healing/

│   └── gemini-self-healing/

│

├── package.json

├── package-lock.json

├── tsconfig.json

│

├── Module1\_RPA\_Engine.pdf

└── OmniSight\_Project\_Modules.docx

```



\## 5. How the Gemini Self-Healing Demonstration Works



The current integrated demonstration follows this process:



1\. Playwright opens the sample shopping webpage in a mobile viewport.

2\. The original layout is measured and a screenshot is captured.

3\. The screenshot and HTML are sent to Gemini for analysis.

4\. Gemini identifies the responsive UI issue and suggests a CSS correction.

5\. The CSS safety validator checks whether the suggestion is approved.

6\. Only approved CSS is applied to the page.

7\. Playwright measures the corrected layout and captures another screenshot.

8\. A JSON report records the analysis, validation, repair, and final result.



\### Demonstrated Test Result



The sample mobile page initially had horizontal overflow.



| Measurement | Before correction | After correction |

|---|---:|---:|

| Viewport width | 390 px | 390 px |

| Document width | 685 px | 390 px |

| Horizontal overflow | Yes | No |

| Checkout button width | 650 px | 320 px |



The recorded demonstration successfully removed the horizontal overflow using an approved responsive CSS correction.



\## 6. Installation and Setup



\### Prerequisites



\- Node.js

\- npm

\- Git

\- A Google Gemini API key for AI-based analysis



\### Install dependencies



```bash

npm install

```



\### Install Playwright Chromium



```bash

npx playwright install chromium

```



Configure the Gemini API key in a local `.env` file according to the environment variable expected by the Gemini integration.



Do not upload API keys or `.env` files to GitHub.



\## 7. Running Tests



\### TypeScript type checking



```bash

npm run typecheck

```



\### Workflow validation tests



```bash

npx tsx engine/workflow.test.ts

```



\### CSS safety tests



```bash

npx tsx demo/css-safety.test.ts

```



\### Verify the Gemini self-healing report



```bash

npx tsx demo/verify-gemini-self-healing-report.ts

```



\### Run the Gemini self-healing demonstration



```bash

npx tsx demo/gemini-self-heal.ts

```



The Gemini demonstration requires a valid API key and network access.



\## 8. Generated Reports and Evidence



The project stores demonstration outputs in the `reports/` directory.



Important evidence includes:



\- Desktop and mobile screenshots.

\- Responsive measurement reports.

\- Gemini visual analysis.

\- CSS validation results.

\- Before-and-after self-healing screenshots.

\- Final self-healing verification report.



The Gemini self-healing evidence is stored in:



```text

reports/gemini-self-healing/

```



\## 9. Testing Status



The following results have been recorded during development:



| Test | Recorded result |

|---|---|

| Workflow validation | 12/12 passing |

| CSS safety validation | 7/7 passing |

| Gemini self-healing report verification | 6/6 passing |

| TypeScript type checking | No errors |



These results describe the recorded local test runs. Run the commands again after making code changes.



\## 10. Current Scope and Limitations



\- Workflow validation checks workflow configuration; it does not prove that every defined browser action is executable.

\- The six workflow action types are defined, but their definitions alone do not establish complete browser execution support.

\- The documented UI failure scenarios are research and proposed test cases; not all have been executed.

\- The current Gemini self-healing demonstration focuses on a specific responsive checkout-width issue.

\- CSS safety validation uses a restricted allowlist and should not be considered a complete CSS security system.

\- The demonstration does not establish automatic repair for every type of website failure.



\## 11. Future Enhancements



\- Expand browser workflow execution and integration testing.

\- Add more UI failure scenarios.

\- Improve element and locator recovery.

\- Extend responsive UI testing to more screen sizes.

\- Improve CSS validation and repair verification.

\- Develop a user interface for managing automation workflows.

\- Explore integration with CI/CD pipelines.



\## 12. Conclusion



OmniSight combines browser automation, workflow validation, AI-based visual analysis, and controlled CSS correction in a practical UI testing demonstration.



The project establishes a foundation for more intelligent and reliable browser automation, with further development planned for broader failure detection and recovery.

