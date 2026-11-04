
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

interface AnalysisIssue {
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
    issues: AnalysisIssue[];
    recommendations: string[];
}

interface CSSValidationResult {
    element: string;
    accepted: boolean;
    originalCSS: string;
    validatedCSS: string | null;
    reasons: string[];
}

function validateSuggestedCSS(css: string): {
    accepted: boolean;
    validatedCSS: string | null;
    reasons: string[];
} {
    const reasons: string[] = [];

    if (typeof css !== "string" || css.trim().length === 0) {
        return {
            accepted: false,
            validatedCSS: null,
            reasons: ["CSS suggestion is empty."]
        };
    }

    if (css.length > 2000) {
        return {
            accepted: false,
            validatedCSS: null,
            reasons: ["CSS suggestion exceeds the 2000-character limit."]
        };
    }

    const normalized = css.trim();

    // Reject potentially dangerous or unsupported CSS instructions.
    const forbiddenPatterns = [
        /@import/i,
        /url\s*\(/i,
        /expression\s*\(/i,
        /javascript\s*:/i,
        /behavior\s*:/i,
        /<\s*script/i
    ];

    for (const pattern of forbiddenPatterns) {
        if (pattern.test(normalized)) {
            reasons.push(
                `Rejected because unsupported or unsafe content was found: ${pattern.source}`
            );
        }
    }

    if (reasons.length > 0) {
        return {
            accepted: false,
            validatedCSS: null,
            reasons
        };
    }

    // Only allow the expected mobile media query.
    let ruleContent = normalized;

    const mediaMatch = normalized.match(
        /^@media\s*\(\s*max-width\s*:\s*600px\s*\)\s*\{([\s\S]*)\}$/i
    );

    if (normalized.toLowerCase().startsWith("@media")) {
        if (!mediaMatch) {
            return {
                accepted: false,
                validatedCSS: null,
                reasons: ["Unsupported or invalid media query."]
            };
        }

        ruleContent = mediaMatch[1].trim();
    }

    // Only allow the checkout button selector.
    const ruleMatch = ruleContent.match(
        /^\.checkout\s*\{([\s\S]*)\}$/i
    );

    if (!ruleMatch) {
        return {
            accepted: false,
            validatedCSS: null,
            reasons: [
                "Only the .checkout CSS selector is approved."
            ]
        };
    }

    const declarationText = ruleMatch[1];

    const declarations = declarationText
        .split(";")
        .map(item => item.trim())
        .filter(item => item.length > 0);

    if (declarations.length === 0) {
        return {
            accepted: false,
            validatedCSS: null,
            reasons: ["No CSS declarations were provided."]
        };
    }

    const approvedDeclarations: string[] = [];
    const allowedProperties = ["width", "max-width"];
    const seenProperties = new Set<string>();

    for (const declaration of declarations) {
        const separator = declaration.indexOf(":");

        if (separator <= 0) {
            reasons.push(`Invalid CSS declaration: ${declaration}`);
            continue;
        }

        const property = declaration
            .slice(0, separator)
            .trim()
            .toLowerCase();

        const value = declaration
            .slice(separator + 1)
            .trim()
            .toLowerCase();

        if (!allowedProperties.includes(property)) {
            reasons.push(`Property is not approved: ${property}`);
            continue;
        }

        if (seenProperties.has(property)) {
            reasons.push(`Duplicate CSS property: ${property}`);
            continue;
        }

        seenProperties.add(property);

        const validValue =
            property === "width"
                ? ["100%", "auto"].includes(value)
                : value === "100%";

        if (!validValue) {
            reasons.push(
                `Value "${value}" is not approved for ${property}.`
            );
            continue;
        }

        approvedDeclarations.push(`${property}: ${value};`);
    }

    if (reasons.length > 0 || approvedDeclarations.length === 0) {
        return {
            accepted: false,
            validatedCSS: null,
            reasons:
                reasons.length > 0
                    ? reasons
                    : ["No approved CSS declarations were found."]
        };
    }

    const validatedCSS =
        `.checkout {\n  ${approvedDeclarations.join("\n  ")}\n}`;

    return {
        accepted: true,
        validatedCSS,
        reasons: [
            "Selector is approved.",
            "All CSS properties and values passed the allowlist checks."
        ]
    };
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
        throw new Error("Invalid structured Gemini analysis report.");
    }

    if (!analysis.issueDetected || analysis.issues.length === 0) {
        throw new Error("No detected UI issues with CSS suggestions to validate.");
    }

    const results: CSSValidationResult[] = [];

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
        note: "Only allowlisted CSS suggestions are accepted. This check does not replace full browser, security, or regression testing."
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
        throw new Error(
            `${rejectedCount} CSS suggestion(s) were rejected.`
        );
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
