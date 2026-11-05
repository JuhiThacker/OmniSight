
import { strict as assert } from "node:assert";
import { validateSuggestedCSS } from "./css-safety";

const testCases = [
    {
        name: "Accept responsive checkout width",
        css: ".checkout { width: 100%; }",
        expected: true
    },
    {
        name: "Accept maximum responsive width",
        css: ".checkout { max-width: 100%; }",
        expected: true
    },
    {
        name: "Accept mobile media query",
        css: "@media (max-width: 600px) { .checkout { width: 100%; } }",
        expected: true
    },
    {
        name: "Reject oversized fixed width",
        css: ".checkout { width: 650px; }",
        expected: false
    },
    {
        name: "Reject unsupported position property",
        css: ".checkout { position: fixed; }",
        expected: false
    },
    {
        name: "Reject unapproved body selector",
        css: "body { width: 100%; }",
        expected: false
    },
    {
        name: "Reject CSS containing external URL",
        css: ".checkout { background: url(https://example.com/image.png); }",
        expected: false
    }
];

function runTests() {
    let passed = 0;
    let failed = 0;

    console.log("\n=== OMNISIGHT CSS SAFETY TESTS ===\n");

    for (const testCase of testCases) {
        try {
            const result = validateSuggestedCSS(testCase.css);

            assert.equal(
                result.accepted,
                testCase.expected,
                `Unexpected validation result for: ${testCase.name}`
            );

            console.log(`PASS: ${testCase.name}`);
            passed++;
        } catch (error) {
            console.log(`FAIL: ${testCase.name}`);

            if (error instanceof Error) {
                console.log(`Reason: ${error.message}`);
            }

            failed++;
        }
    }

    console.log("\n=== TEST SUMMARY ===");
    console.log(`Total tests: ${testCases.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        throw new Error("CSS safety tests failed.");
    }

    console.log("\nAll CSS safety tests passed!");
}

runTests();
