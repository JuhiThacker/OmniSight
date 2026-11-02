
import "dotenv/config";

import { GoogleGenAI } from "@google/genai";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

async function main() {
    console.log("Starting OmniSight Gemini visual analysis...");

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

    console.log("Mobile screenshot loaded.");
    console.log("Shopping webpage HTML loaded.");

    const ai = new GoogleGenAI({
        apiKey: apiKey
    });

    const prompt = `
You are a visual UI quality analyst working on the OmniSight project.

Analyse the attached mobile screenshot and the webpage HTML.

The webpage is a shopping page displayed at a mobile viewport width
of 390 pixels.

Your tasks:

1. Describe the visible webpage layout.
2. Identify any visible UI problems.
3. Explain which element appears to cause the problem.
4. Examine the provided HTML and CSS for the likely technical cause.
5. Suggest a safe CSS correction.
6. Explain how the proposed correction should improve the layout.

Use these headings in your response:

VISUAL ANALYSIS
DETECTED UI ISSUES
LIKELY TECHNICAL CAUSE
SUGGESTED CSS FIX
EXPECTED RESULT

Important:
Do not claim that a correction has been applied.
This is an analysis-only test.
If you cannot confirm something from the screenshot or HTML,
clearly state that limitation.

HTML SOURCE:

${html}
`;

    console.log("\nSending screenshot and HTML to Gemini...");

    const response = await ai.interactions.create({
        model: "gemini-3.8-flash",
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
        ]
    });

    const analysis = response.output_text?.trim();

    if (!analysis) {
        throw new Error(
            "Gemini returned no text analysis."
        );
    }

    const outputDirectory = resolve("reports/ai-analysis");

    await mkdir(outputDirectory, { recursive: true });

    const reportPath = resolve(
        outputDirectory,
        "gemini-visual-analysis.txt"
    );

    await writeFile(reportPath, analysis, "utf-8");

    console.log("\n====================================");
    console.log("OMNISIGHT GEMINI VISUAL ANALYSIS");
    console.log("====================================\n");

    console.log(analysis);

    console.log("\n====================================");
    console.log("AI analysis report saved to:");
    console.log(reportPath);
}

main().catch((error) => {
    console.error("\nGemini visual analysis failed.");

    if (error instanceof Error) {
        console.error(error.message);
    } else {
        console.error(error);
    }

    process.exitCode = 1;
});
