
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

async function main() {
    const browser = await chromium.launch({ headless: true });

    try {
        const outputDirectory = resolve("reports/responsive");

        await mkdir(outputDirectory, { recursive: true });

        const page = await browser.newPage({
            viewport: {
                width: 1280,
                height: 800
            },
            deviceScaleFactor: 1
        });

        const webpage = pathToFileURL(
            resolve("demo/index.html")
        ).href;

        console.log("Opening OmniSight shopping demo...");

        await page.goto(webpage);

        // Capture desktop screenshot
        await page.screenshot({
            path: resolve(outputDirectory, "desktop.png"),
            fullPage: true
        });

        console.log("Desktop screenshot captured.");

        const desktopCheck = await page.evaluate(() => {
            return {
                viewportWidth: window.innerWidth,
                documentWidth: document.documentElement.scrollWidth,
                horizontalOverflow:
                    document.documentElement.scrollWidth > window.innerWidth
            };
        });

        // Change browser to mobile dimensions
        await page.setViewportSize({
            width: 390,
            height: 844
        });

        await page.reload();

        // Capture mobile screenshot
        await page.screenshot({
            path: resolve(outputDirectory, "mobile.png"),
            fullPage: true
        });

        console.log("Mobile screenshot captured.");

        // Check mobile layout
        const mobileCheck = await page.evaluate(() => {
            const button = document.querySelector(
                ".checkout"
            ) as HTMLElement | null;

            const rect = button?.getBoundingClientRect();

            return {
                viewportWidth: window.innerWidth,
                documentWidth: document.documentElement.scrollWidth,
                horizontalOverflow:
                    document.documentElement.scrollWidth > window.innerWidth,
                checkoutButton: rect
                    ? {
                        left: Math.round(rect.left),
                        right: Math.round(rect.right),
                        width: Math.round(rect.width),
                        extendsPastViewport: rect.right > window.innerWidth
                    }
                    : null
            };
        });

        const report = {
            project: "OmniSight",
            test: "Responsive UI Layout Test",
            desktop: desktopCheck,
            mobile: mobileCheck,
            detectedIssue:
                mobileCheck.horizontalOverflow ||
                (mobileCheck.checkoutButton?.extendsPastViewport ?? false)
        };

        await writeFile(
            resolve(outputDirectory, "responsive-report.json"),
            JSON.stringify(report, null, 2),
            "utf-8"
        );

        console.log("\n=== RESPONSIVE TEST REPORT ===");
        console.log(JSON.stringify(report, null, 2));

        console.log("\nAll screenshots and the report are saved in:");
        console.log(outputDirectory);
    } finally {
        await browser.close();
    }
}

main().catch((error) => {
    console.error("Responsive test failed:", error);
    process.exitCode = 1;
});
