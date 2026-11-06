
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { validateSuggestedCSS } from "./css-safety";

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

        // Measure the original layout.
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

        console.log("Original layout measured.");

        // Example AI-style CSS suggestion for the detected issue.
        const suggestedCSS = `
            @media (max-width: 600px) {
                .checkout {
                    width: 100%;
                    max-width: 100%;
                }
            }
        `;

        // Validate the suggestion before applying it.
        const validation = validateSuggestedCSS(suggestedCSS);

        console.log("\nCSS validation result:");
        console.log(JSON.stringify(validation, null, 2));

        let repairApplied = false;

        if (beforeFix.buttonOverflows && validation.accepted &&
            validation.validatedCSS) {

            console.log("\nApproved CSS found. Applying correction...");

            // Keep the correction limited to mobile screens.
            await page.addStyleTag({
                content: `
                    @media (max-width: 600px) {
                        ${validation.validatedCSS}
                    }
                `
            });

            repairApplied = true;
        } else {
            console.log(
                "\nNo correction applied. Issue absent or CSS not approved."
            );
        }

        // Measure the layout after the attempted correction.
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
            test: "Validated CSS Self-Healing Test",
            beforeFix,
            cssValidation: validation,
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

        console.log("\n=== VALIDATED SELF-HEALING REPORT ===");
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
