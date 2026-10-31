
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

async function main() {
    const browser = await chromium.launch({ headless: true });

    try {
        const outputDirectory = resolve("reports/self-healing");
        await mkdir(outputDirectory, { recursive: true });

        const page = await browser.newPage({
            viewport: { width: 390, height: 844 },
            deviceScaleFactor: 1
        });

        const webpage = pathToFileURL(
            resolve("demo/index.html")
        ).href;

        console.log("Opening shopping demo in mobile view...");

        await page.goto(webpage);

        // Measure the original mobile layout.
        const beforeFix = await page.evaluate(() => {
            const button = document.querySelector(
                ".checkout"
            ) as HTMLElement | null;

            const rect = button?.getBoundingClientRect();

            return {
                viewportWidth: window.innerWidth,
                documentWidth: document.documentElement.scrollWidth,
                horizontalOverflow:
                    document.documentElement.scrollWidth >
                    window.innerWidth,
                buttonWidth: rect ? Math.round(rect.width) : null,
                buttonRight: rect ? Math.round(rect.right) : null,
                buttonOverflows:
                    rect ? rect.right > window.innerWidth : false
            };
        });

        await page.screenshot({
            path: resolve(outputDirectory, "mobile-before-fix.png"),
            fullPage: true
        });

        console.log("Original mobile screenshot saved.");

        let repairApplied = false;

        // Apply a CSS repair if the checkout button overflows.
        if (beforeFix.buttonOverflows) {
            console.log("UI issue detected. Applying CSS repair...");

            await page.addStyleTag({
                content: `
                    @media (max-width: 600px) {
                        .checkout {
                            width: 100% !important;
                            max-width: 100% !important;
                        }
                    }
                `
            });

            repairApplied = true;
        }

        // Measure the layout again after the repair.
        const afterFix = await page.evaluate(() => {
            const button = document.querySelector(
                ".checkout"
            ) as HTMLElement | null;

            const rect = button?.getBoundingClientRect();

            return {
                viewportWidth: window.innerWidth,
                documentWidth: document.documentElement.scrollWidth,
                horizontalOverflow:
                    document.documentElement.scrollWidth >
                    window.innerWidth,
                buttonWidth: rect ? Math.round(rect.width) : null,
                buttonRight: rect ? Math.round(rect.right) : null,
                buttonOverflows:
                    rect ? rect.right > window.innerWidth : false
            };
        });

        await page.screenshot({
            path: resolve(outputDirectory, "mobile-after-fix.png"),
            fullPage: true
        });

        const report = {
            project: "OmniSight",
            test: "Mobile UI Self-Healing Test",
            beforeFix,
            repairApplied,
            afterFix,
            repairSuccessful:
                repairApplied &&
                !afterFix.horizontalOverflow &&
                !afterFix.buttonOverflows
        };

        await writeFile(
            resolve(outputDirectory, "self-healing-report.json"),
            JSON.stringify(report, null, 2),
            "utf-8"
        );

        console.log("\n=== SELF-HEALING TEST REPORT ===");
        console.log(JSON.stringify(report, null, 2));

        console.log("\nScreenshots and report saved in:");
        console.log(outputDirectory);
    } finally {
        await browser.close();
    }
}

main().catch((error) => {
    console.error("Self-healing test failed:", error);
    process.exitCode = 1;
});
