
export interface CSSValidation {
    accepted: boolean;
    validatedCSS: string | null;
    reasons: string[];
}

export function validateSuggestedCSS(css: string): CSSValidation {
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
            reasons: ["CSS suggestion exceeds the size limit."]
        };
    }

    const normalized = css.trim();

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
            reasons.push("Unsafe or unsupported CSS content detected.");
        }
    }

    if (reasons.length > 0) {
        return {
            accepted: false,
            validatedCSS: null,
            reasons
        };
    }

    let ruleContent = normalized;

    const mediaMatch = normalized.match(
        /^@media\s*\(\s*max-width\s*:\s*600px\s*\)\s*\{([\s\S]*)\}$/i
    );

    if (normalized.toLowerCase().startsWith("@media")) {
        if (!mediaMatch) {
            return {
                accepted: false,
                validatedCSS: null,
                reasons: ["Unsupported media query."]
            };
        }

        ruleContent = mediaMatch[1].trim();
    }

    const ruleMatch = ruleContent.match(
        /^\.checkout\s*\{([\s\S]*)\}$/i
    );

    if (!ruleMatch) {
        return {
            accepted: false,
            validatedCSS: null,
            reasons: ["Only the .checkout selector is approved."]
        };
    }

    const declarations = ruleMatch[1]
        .split(";")
        .map(item => item.trim())
        .filter(Boolean);

    if (declarations.length === 0) {
        return {
            accepted: false,
            validatedCSS: null,
            reasons: ["No CSS declarations provided."]
        };
    }

    const allowedProperties = ["width", "max-width"];
    const approvedDeclarations: string[] = [];
    const seenProperties = new Set<string>();

    for (const declaration of declarations) {
        const separator = declaration.indexOf(":");

        if (separator <= 0) {
            reasons.push("Invalid CSS declaration.");
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
            reasons.push(`Unapproved property: ${property}`);
            continue;
        }

        if (seenProperties.has(property)) {
            reasons.push(`Duplicate property: ${property}`);
            continue;
        }

        seenProperties.add(property);

        const validValue =
            property === "width"
                ? ["100%", "auto"].includes(value)
                : value === "100%";

        if (!validValue) {
            reasons.push(`Unapproved value for ${property}: ${value}`);
            continue;
        }

        approvedDeclarations.push(`${property}: ${value};`);
    }

    if (reasons.length > 0 || approvedDeclarations.length === 0) {
        return {
            accepted: false,
            validatedCSS: null,
            reasons
        };
    }

    return {
        accepted: true,
        validatedCSS:
            `.checkout {\n  ${approvedDeclarations.join("\n  ")}\n}`,
        reasons: ["CSS passed all allowlist checks."]
    };
}
