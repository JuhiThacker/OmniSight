
import "dotenv/config";

import { GoogleGenAI } from "@google/genai";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

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
            throw new Error("Invalid issue entry in Gemini response.");
        }

        const item = issue as Record<string, unknown>;

        const requiredFields = [
            "element",
            "description",
            "severity",
            "evidence",
            "likelyCause",
            "suggestedCSS"
        ];

        for (const field of requiredFields) {
            if (typeof item[field] !== "string") {
                throw new Error(
                    `Invalid or missing issue field: ${field}`
                );
            }
        }
    }

    if (!result.recommendations.every(
        item => typeof item === "string"
    )) {
        throw new Error("Invalid recommendation in Gemini response.");
    }

    return result as unknown as StructuredAnalysis;
}

async function main() {
    console.log("Starting structured Gemini UI analysis...");

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error(
            "Gemini API key not found. Check your .env file."
        );
    }

    const screenshotPath = resolve(
        "reports/responsive/mobile.png"
    );

    const htmlPath = resolve("demo/index.html");

    const screenshot = await readFile(screenshotPath);
    const html = await readFile(htmlPath, "utf-8");

    const ai = new GoogleGenAI({
        apiKey
    });

    const prompt = `
You are the visual UI analysis engine of OmniSight.

Analyse the supplied mobile screenshot and HTML source.

The page is displayed at a mobile viewport width of 390 pixels.

Return a structured visual analysis.

Identify actual UI issues visible in the screenshot.
Use the HTML and CSS to explain the likely cause.
Suggest a CSS correction but DO NOT apply it.
Do not invent problems that are not supported by the evidence.

Return these fields:

pageSummary: A brief description of the page.
issueDetected: true if a UI issue is detected, otherwise false.
issues: An array of detected issues. For each issue include:
- element: The affected HTML element or CSS selector.
- description: What is visually wrong.
- severity: low, medium, high, or critical.
- evidence: What in the screenshot supports the finding.
- likelyCause: The likely cause in the HTML or CSS.
- suggestedCSS: A proposed CSS correction.

recommendations: An array of short recommendations.

HTML SOURCE:

${html}
`;

    const schema = {
        type: "object",
        properties: {
            pageSummary: {
                type: "string"
            },
            issueDetected: {
                type: "boolean"
            },
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
                items: {
                    type: "string"
                }
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

    const output = response.output_text;

    if (!output) {
        throw new Error("Gemini returned an empty response.");
    }

    console.log("Gemini response received. Validating JSON...");

    let parsedResponse: unknown;

    try {
        parsedResponse = JSON.parse(output);
    } catch {
        throw new Error("Gemini response was not valid JSON.");
    }

    const analysis = validateAnalysis(parsedResponse);

    const outputDirectory = resolve("reports/ai-analysis");

    await mkdir(outputDirectory, { recursive: true });

    const reportPath = resolve(
        outputDirectory,
        "gemini-structured-analysis.json"
    );

    await writeFile(
        reportPath,
        JSON.stringify(analysis, null, 2),
        "utf-8"
    );

    console.log("\n=== STRUCTURED GEMINI ANALYSIS ===\n");

    console.log(JSON.stringify(analysis, null, 2));

    console.log("\nJSON validation: PASSED");
    console.log("Detected issues:", analysis.issues.length);
    console.log("Report saved to:", reportPath);
}

main().catch(error => {
    console.error("\nStructured Gemini analysis failed.");

    if (error instanceof Error) {
        console.error(error.message);
    } else {
        console.error(error);
    }

    process.exitCode = 1;
});
