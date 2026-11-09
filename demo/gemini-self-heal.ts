
import "dotenv/config";

import { GoogleGenAI } from "@google/genai";
import { chromium } from "playwright";
import {
    mkdir,
    readFile,
    writeFile
} from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { validateSuggestedCSS } from "./css-safety";

interface UIIssue {
    element: string;
    description: string;
    severity: string;
    evidence: string;
    likelyCause: string;
    suggestedCSS: string;
}

interface StructuredAnalysis {
    pageSummary: string;
    issueDetected: boolean;
    issues: UIIssue[];
    recommendations: string[];
}

function validateAnalysis(value: unknown): StructuredAnalysis {
    if (typeof value !== "object" || value === null) {
        throw new Error("Gemini response is not a JSON object.");
    }

    const result = value as Record<string, unknown>;

    if (
        typeof result.pageSummary !== "string" ||
        typeof result.issueDetected !== "boolean" ||
        !Array.isArray(result.issues) ||
        !Array.isArray(result.recommendations)
    ) {
        throw new Error("Gemini response is missing required fields.");
    }

    for (const issue of result.issues) {
        if (typeof issue !== "object" || issue === null) {
            throw new Error("Invalid issue entry.");
        }

        const item = issue as Record<string, unknown>;

        const fields = [
            "element",
            "description",
            "severity",
            "evidence",
            "likelyCause",
            "suggestedCSS"
        ];

        for (const field of fields) {
            if (typeof item[field] !== "string") {
                throw new Error(`Invalid issue field: ${field}`);
            }
        }
    }

    if (
        !result.recommendations.every(
            item => typeof item === "string"
        )
    ) {
        throw new Error("Invalid recommendation.");
    }

    return result as unknown as StructuredAnalysis;
}

async function main() {
    console.log("\n=== OMNISIGHT GEMINI SELF-HEALING ===\n");

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error(
            "GEMINI_API_KEY is missing. Check your .env file."
        );
    }

    const ai = new GoogleGenAI({ apiKey });

    const outputDirectory = resolve("reports/gemini-self-healing");

    await mkdir(outputDirectory, { recursive: true });

    const browser = await chromium.launch({
        headless: true
    });

    try {
        const page = await browser.newPage({
            viewport: {
                width: 390,
                height: 844
            },
            deviceScaleFactor: 1
        });

        const webpage = pathToFileURL(
            resolve("demo/index.html")
        ).href;

        console.log("Opening shopping demo in mobile view...");

        await page.goto(webpage);

        const beforeFix = await page.evaluate(() => {
            const button = document.querySelector(
                ".checkout"
            ) as HTMLElement | null;

            const rect = button?.getBoundingClientRect();

            return {
                viewportWidth: window.innerWidth,
                documentWidth:
                    document.documentElement.scrollWidth,
                horizontalOverflow:
                    document.documentElement.scrollWidth >
                    window.innerWidth,
                buttonWidth: rect
                    ? Math.round(rect.width)
                    : null,
                buttonRight: rect
                    ? Math.round(rect.right)
                    : null
            };
        });

        await page.screenshot({
            path: resolve(outputDirectory, "before-fix.png"),
            fullPage: true
        });

        console.log("Original layout measured.");

        const screenshot = await readFile(
            resolve(outputDirectory, "before-fix.png")
        );

        const html = await readFile(
            resolve("demo/index.html"),
            "utf-8"
        );

        const prompt = `
You are the visual UI analysis engine of OmniSight.

Analyse the supplied mobile screenshot and HTML source.

The viewport width is 390 pixels.

Identify actual visual UI problems.
Use the HTML and CSS to explain their likely causes.
Suggest CSS corrections, but do not apply them.
Do not invent problems.

Return a JSON object with these fields:

pageSummary: string
issueDetected: boolean
issues: array of objects containing:
- element
- description
- severity
- evidence
- likelyCause
- suggestedCSS

recommendations: array of strings.

HTML SOURCE:

${html}
`;

        const schema = {
            type: "object",
            properties: {
                pageSummary: { type: "string" },
                issueDetected: { type: "boolean" },
                issues: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            element: { type: "string" },
                            description: { type: "string" },
                            severity: { type: "string" },
                            evidence: { type: "string" },
                            likelyCause: { type: "string" },
                            suggestedCSS: { type: "string" }
                        },
                        required: [
                            "element",
                            "description",
                            "severity",
                            "evidence",
                            "likelyCause",
                            "suggestedCSS"
                        ]
                    }
                },
                recommendations: {
                    type: "array",
                    items: { type: "string" }
                }
            },
            required: [
                "pageSummary",
                "issueDetected",
                "issues",
                "recommendations"
            ]
        };

        console.log("Sending screenshot and HTML to Gemini...");

        const response = await ai.interactions.create({
            model: "gemini-3.6-flash",
            input: [
                {
                    type: "text",
                    text: prompt
                },
                {
                    type: "image",
                    data: screenshot.toString("base64"),
                    mime_type: "image/png"
                }
            ],
            response_format: {
                type: "text",
                mime_type: "application/json",
                schema
            }
        });

        if (!response.output_text) {
            throw new Error("Gemini returned an empty response.");
        }

        const analysis = validateAnalysis(
            JSON.parse(response.output_text)
        );

        await writeFile(
            resolve(outputDirectory, "gemini-analysis.json"),
            JSON.stringify(analysis, null, 2),
            "utf-8"
        );

        console.log("\nGemini analysis completed.");
        console.log("Issue detected:", analysis.issueDetected);

        let validationResult = {
            accepted: false,
            validatedCSS: null as string | null,
            reasons: ["No applicable CSS suggestion was found."]
        };

        let repairApplied = false;

       const checkoutIssue = analysis.issues.find(
    issue => {
        const selector = issue.element.trim().toLowerCase();

        return (
            selector === ".checkout" ||
            selector === "button.checkout"
        );
    }
);
        if (beforeFix.horizontalOverflow && checkoutIssue) {
            console.log("\nGemini CSS suggestion:");
            console.log(checkoutIssue.suggestedCSS);

            validationResult = validateSuggestedCSS(
                checkoutIssue.suggestedCSS
            );

            console.log("\nCSS validation result:");
            console.log(
                JSON.stringify(validationResult, null, 2)
            );

            if (
                validationResult.accepted &&
                validationResult.validatedCSS
            ) {
                console.log("\nApplying approved CSS...");

                await page.addStyleTag({
                    content: `
                        @media (max-width: 600px) {
                            ${validationResult.validatedCSS}
                        }
                    `
                });

                repairApplied = true;
            } else {
                console.log(
                    "\nCSS rejected. No correction was applied."
                );
            }
        } else if (!beforeFix.horizontalOverflow) {
            console.log("\nNo mobile overflow found. No CSS applied.");
        } else {
            console.log(
                "\nNo applicable .checkout suggestion found."
            );
        }

        const afterFix = await page.evaluate(() => {
            const button = document.querySelector(
                ".checkout"
            ) as HTMLElement | null;

            const rect = button?.getBoundingClientRect();

            return {
                viewportWidth: window.innerWidth,
                documentWidth:
                    document.documentElement.scrollWidth,
                horizontalOverflow:
                    document.documentElement.scrollWidth >
                    window.innerWidth,
                buttonWidth: rect
                    ? Math.round(rect.width)
                    : null,
                buttonRight: rect
                    ? Math.round(rect.right)
                    : null
            };
        });

        await page.screenshot({
            path: resolve(outputDirectory, "after-fix.png"),
            fullPage: true
        });

        const report = {
            project: "OmniSight",
            test: "Gemini AI Responsive Self-Healing",
            beforeFix,
            geminiAnalysis: analysis,
            cssValidation: validationResult,
            repairApplied,
            afterFix,
            repairSuccessful:
                repairApplied &&
                beforeFix.horizontalOverflow &&
                !afterFix.horizontalOverflow
        };

        await writeFile(
            resolve(outputDirectory, "self-healing-report.json"),
            JSON.stringify(report, null, 2),
            "utf-8"
        );

        console.log("\n=== FINAL SELF-HEALING REPORT ===\n");
        console.log(JSON.stringify(report, null, 2));

        console.log("\nScreenshots and reports saved in:");
        console.log(outputDirectory);

    } finally {
        await browser.close();
    }
}

main().catch(error => {
    console.error("\nGemini self-healing failed:");

    console.error(
        error instanceof Error ? error.message : error
    );

    process.exitCode = 1;
});
