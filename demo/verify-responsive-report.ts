
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

interface ResponsiveReport {
    desktop?: {
        horizontalOverflow?: boolean;
    };
    mobile?: {
        viewportWidth?: number;
        horizontalOverflow?: boolean;
        checkoutButton?: {
            extendsPastViewport?: boolean;
        } | null;
    };
    detectedIssue?: boolean;
}

async function main() {
    const reportPath = resolve(
        "reports/responsive/responsive-report.json"
    );

    const reportText = await readFile(reportPath, "utf-8");
    const report = JSON.parse(reportText) as ResponsiveReport;

    const checks = [
        {
            name: "Desktop layout has no horizontal overflow",
            passed: report.desktop?.horizontalOverflow === false
        },
        {
            name: "Mobile viewport is 390 pixels",
            passed: report.mobile?.viewportWidth === 390
        },
        {
            name: "Mobile horizontal overflow is detected",
            passed: report.mobile?.horizontalOverflow === true
        },
        {
            name: "Checkout button extends beyond the viewport",
            passed:
                report.mobile?.checkoutButton?.extendsPastViewport === true
        },
        {
            name: "Overall UI issue is detected",
            passed: report.detectedIssue === true
        }
    ];

    console.log("\n=== RESPONSIVE REPORT VERIFICATION ===\n");

    for (const check of checks) {
        console.log(`${check.passed ? "PASS" : "FAIL"}: ${check.name}`);
    }

    const failed = checks.filter(check => !check.passed).length;

    console.log(`\nPassed: ${checks.length - failed}/${checks.length}`);

    if (failed > 0) {
        throw new Error("Responsive report verification failed.");
    }

    console.log("\nAll responsive verification checks passed!");
}

main().catch(error => {
    console.error("Verification error:", error);
    process.exitCode = 1;
});
