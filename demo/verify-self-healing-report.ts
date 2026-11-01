
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

interface SelfHealingReport {
    beforeFix?: {
        horizontalOverflow?: boolean;
    };
    repairApplied?: boolean;
    afterFix?: {
        horizontalOverflow?: boolean;
        buttonOverflows?: boolean;
    };
    repairSuccessful?: boolean;
}

async function main() {
    const reportPath = resolve(
        "reports/self-healing/self-healing-report.json"
    );

    const reportText = await readFile(reportPath, "utf-8");
    const report = JSON.parse(reportText) as SelfHealingReport;

    const checks = [
        {
            name: "Original mobile issue detected",
            passed: report.beforeFix?.horizontalOverflow === true
        },
        {
            name: "CSS repair was applied",
            passed: report.repairApplied === true
        },
        {
            name: "Horizontal overflow removed",
            passed: report.afterFix?.horizontalOverflow === false
        },
        {
            name: "Checkout button fits the screen",
            passed: report.afterFix?.buttonOverflows === false
        },
        {
            name: "Overall repair marked successful",
            passed: report.repairSuccessful === true
        }
    ];

    console.log("\n=== SELF-HEALING VERIFICATION ===\n");

    for (const check of checks) {
        console.log(
            `${check.passed ? "PASS" : "FAIL"}: ${check.name}`
        );
    }

    const failedChecks = checks.filter(
        check => !check.passed
    ).length;

    console.log(`\nPassed: ${checks.length - failedChecks}/${checks.length}`);

    if (failedChecks > 0) {
        throw new Error("Self-healing verification failed.");
    }

    console.log("\nAll verification checks passed!");
}

main().catch(error => {
    console.error("Verification error:", error);
    process.exitCode = 1;
});
