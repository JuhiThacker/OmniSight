# UI Test Failure Research – OmniSight

## 1. Objective

The objective of this research is to identify common reasons why browser automation tests fail and document test cases that can help OmniSight detect these failures.

## 2. Common UI Test Failure Scenarios

### Scenario 1: Changed Element ID

A website developer changes a button's ID. An automation script using the old ID may no longer find the button.

**Expected result:** The automation should record the failure and its reason.

### Scenario 2: Changed Button Text

The text on a button changes, such as “Submit” to “Continue”.

**Expected result:** The test should identify that the expected button text or locator has changed.

### Scenario 3: Element Moved

A button is moved to a different part of the page.

**Expected result:** The test should check whether the automation can still locate the correct button.

### Scenario 4: Missing Element

A required input field or button is removed from the page.

**Expected result:** The automation should report that the required element could not be found.

### Scenario 5: Slow Page Loading

A page takes longer than expected to load its content.

**Expected result:** The automation should record a timeout or loading failure instead of silently continuing.

### Scenario 6: Unexpected Popup

A popup or dialog appears and blocks the intended action.

**Expected result:** The automation should record the unexpected dialog and its effect on the workflow.

## 3. Proposed Testing Method

1. Run a simple browser workflow on the original webpage.
2. Record whether each step succeeds or fails.
3. Change one UI element or condition at a time.
4. Run the workflow again.
5. Record the error message and screenshot, where available.
6. Compare the original and modified runs.

## 4. Information to Record

For each test, record:

* Test case name
* UI change introduced
* Expected result
* Actual result
* Error message, if any
* Screenshot, if available
* Whether the issue was detected correctly

## 5. Initial Scope

The first stage should focus on detecting and recording UI failures. Automatic element repair should be considered only after basic failure detection has been tested.

## 6. Further Research

* Reliable browser locators
* Handling timeouts and missing elements
* Screenshot-based failure analysis
* Self-healing test automation
* Playwright documentation: https://playwright.dev/docs/locators

## 7. Current Status

This document is an initial research draft. The test cases and implementation approach should be reviewed with the team before implementation.
