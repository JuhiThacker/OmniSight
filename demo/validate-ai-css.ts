
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateSuggestedCSS } from "./css-safety";

interface AnalysisIssue {
    element: string;
    suggestedCSS: string;
}

interface StructuredAnalysis {
    issueDetected: boolean;
    issues: AnalysisIssue[];
}

async function main() {
    console.log("Starting OmniSight AI CSS validation...");

    const inputPath = resolve(
        "reports/ai-analysis/gemini-structured-analysis.json"
    );

    const inputText = await readFile(inputPath, "utf-8");
    const analysis = JSON.parse(inputText) as StructuredAnalysis;

    if (
        typeof analysis.issueDetected !== "boolean" ||
        !Array.isArray(analysis.issues)
    ) {
        throw new Error("Invalid Gemini analysis report.");
    }

    if (!analysis.issueDetected || analysis.issues.length === 0) {
        throw new Error("No UI issues found for CSS validation.");
    }

    const results = [];

    for (const issue of analysis.issues) {
        console.log(`\nValidating CSS for: ${issue.element}`);

        const validation = validateSuggestedCSS(
            issue.suggestedCSS
        );

        results.push({
            element: issue.element,
            accepted: validation.accepted,
            originalCSS: issue.suggestedCSS,
            validatedCSS: validation.validatedCSS,
            reasons: validation.reasons
        });

        console.log(
            validation.accepted
                ? "PASS: CSS suggestion accepted."
                : "FAIL: CSS suggestion rejected."
        );

        for (const reason of validation.reasons) {
            console.log(`- ${reason}`);
        }
    }

    const approvedCount = results.filter(
        result => result.accepted
    ).length;

    const rejectedCount = results.length - approvedCount;

    const report = {
        project: "OmniSight",
        test: "AI-Generated CSS Safety Validation",
        inputFile: "gemini-structured-analysis.json",
        totalSuggestions: results.length,
        approvedSuggestions: approvedCount,
        rejectedSuggestions: rejectedCount,
        results,
        overallStatus:
            rejectedCount === 0 ? "APPROVED" : "REJECTED",
        note: "Only allowlisted CSS suggestions are accepted. Further browser and regression testing is still required."
    };

    const outputDirectory = resolve("reports/ai-analysis");

    await mkdir(outputDirectory, { recursive: true });

    const reportPath = resolve(
        outputDirectory,
        "css-validation-report.json"
    );

    await writeFile(
        reportPath,
        JSON.stringify(report, null, 2),
        "utf-8"
    );

    console.log("\n=== CSS VALIDATION REPORT ===");
    console.log(JSON.stringify(report, null, 2));

    console.log("\nValidation report saved to:");
    console.log(reportPath);

    if (rejectedCount > 0) {
        throw new Error("One or more CSS suggestions were rejected.");
    }

    console.log("\nAll CSS suggestions passed validation.");
}

main().catch(error => {
    console.error("\nAI CSS validation failed.");

    if (error instanceof Error) {
        console.error(error.message);
    } else {
        console.error(error);
    }

    process.exitCode = 1;
});
