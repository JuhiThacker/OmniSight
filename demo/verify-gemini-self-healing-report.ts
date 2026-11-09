import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

interface GeminiSelfHealingReport {
    beforeFix?: {
        viewportWidth?: number;
        documentWidth?: number;
        horizontalOverflow?: boolean;
    };
    cssValidation?: {
        accepted?: boolean;
    };
    repairApplied?: boolean;
    afterFix?: {
        viewportWidth?: number;
        documentWidth?: number;
        horizontalOverflow?: boolean;
    };
    repairSuccessful?: boolean;
}

async function main() {
    const reportPath = resolve(
        "reports/gemini-self-healing/self-healing-report.json"
    );

    const reportText = await readFile(reportPath, "utf-8");
    const report = JSON.parse(reportText) as GeminiSelfHealingReport;

    const checks = [
        {
            name: "Original mobile overflow detected",
            passed: report.beforeFix?.horizontalOverflow === true
        },
        {
            name: "Gemini CSS suggestion passed safety validation",
            passed: report.cssValidation?.accepted === true
        },
        {
            name: "CSS repair was applied",
            passed: report.repairApplied === true
        },
        {
            name: "Final document width matches viewport width",
            passed:
                report.afterFix?.documentWidth ===
                report.afterFix?.viewportWidth
        },
        {
            name: "Horizontal overflow removed",
            passed: report.afterFix?.horizontalOverflow === false
        },
        {
            name: "Overall repair marked successful",
            passed: report.repairSuccessful === true
        }
    ];

    console.log("\n=== GEMINI SELF-HEALING VERIFICATION ===\n");

    for (const check of checks) {
        console.log(
            `${check.passed ? "PASS" : "FAIL"}: ${check.name}`
        );
    }

    const failedChecks = checks.filter(
        check => !check.passed
    ).length;

    console.log(
        `\nPassed: ${checks.length - failedChecks}/${checks.length}`
    );

    if (failedChecks > 0) {
        throw new Error("Gemini self-healing verification failed.");
    }

    console.log("\nAll Gemini self-healing checks passed!");
}

main().catch(error => {
    console.error("Verification error:", error);
    process.exitCode = 1;
});