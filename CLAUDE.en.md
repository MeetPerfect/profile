# Project Notes for Claude (English)

This repository contains a browser userscript designed for autumn campus recruitment scenarios. The main script is `resume_autofill.user.js`, which reads local data from `profile.json` and automatically fills common fields in online application forms on various recruitment websites.

---

## Repository Structure

- `resume_autofill.user.js`
  - Main Tampermonkey userscript
  - Core components:
    - Data storage: `GM_getValue` / `GM_setValue` / `GM_deleteValue` with a single storage key (`resume_profile_v1`)
    - Form value helpers: `setNativeValue`, `triggerAll`, `fillEl`
    - Field location & fill strategies:
      - `fillByLabelText`: locate inputs by label text, sibling elements, and parent containers
      - `fillByPlaceholder`: fallback matching via placeholder keywords
      - `fill`: combined strategy that tries label first, then placeholder
    - Section-specific fill functions:
      - `fillBasic`: basic personal info
      - `fillEducation`: education background
      - `fillInternship`: internship experience
      - `fillLanguages`: language skills
      - `fillCertificates`: certificates
      - `fillSkills`: technical skills
      - `fillFamily`: family information (special handling because the label "姓名" is reused)
    - Entry point: `autoFill`, which calls all section functions in order
    - UI components:
      - Floating action button at the bottom-right corner
      - Menu with actions (autofill / import / preview / clear)
      - Overlay, import dialog, preview dialog
      - Toast notifications
- `profile.json`
  - Example configuration file demonstrating the expected data shape and field names
  - Intended as a reference for the user to prepare their own local profile data

Currently there is no additional business logic or configuration in this repository.

---

## Development Guidelines

When modifying or extending this project, please follow these guidelines:

1. **Language and Dependencies**
   - Use plain JavaScript only; do not introduce additional frameworks or build tools.
   - Keep the script as a single file so that users can easily copy and paste it into Tampermonkey.

2. **Privacy and Security**
   - Do not add any logic that uploads `profile.json` or local storage data to remote servers.
   - If network requests are ever introduced, their purpose must be clearly documented in the README, and users should explicitly opt in.

3. **Compatibility and Stability**
   - Prefer extending existing helper functions (`fillByLabelText`, `fillByPlaceholder`, `fill`) instead of writing completely separate logic for each target site.
   - Avoid relying heavily on fragile DOM assumptions; use semantic clues such as label text and placeholders whenever possible.
   - Try not to change existing field mappings unless absolutely necessary, to avoid breaking already supported sites.

4. **Logging and Debugging**
   - Use the `log` helper (with the `[简历助手]` prefix) for console output so that logs are easy to filter.
   - Avoid excessive logging in production; keep only messages that are useful for debugging.

---

## Collaboration Notes for Claude

When you (Claude) help develop or debug this repository, please pay attention to the following:

1. **Understand the Data Model First**
   - Before changing any filling logic, read through `profile.json` to understand how each field is mapped to form labels / placeholders.
   - Assume the user may already maintain their own local `profile.json`. Do not propose schema changes unless the user explicitly asks for them.

2. **Strategy for New Site Adaptation**
   - When supporting new sites, first try to locate inputs using:
     - Label text (exact or partial match)
     - Sibling elements near the label
     - Inputs / textareas in nearby parent containers
     - Placeholder keywords as a fallback
   - If you must add site-specific logic, wrap it in clearly named helper functions and add a short comment indicating which site it targets and why.

3. **Avoid Over-Refactoring**
   - Since this is a userscript that needs to be pasted into Tampermonkey, keep the structure flat, readable, and dependency-free.
   - Do not perform large-scale refactors or introduce heavy abstractions unless there is a strong, explicit requirement.

4. **User Experience Considerations**
   - Keep the floating button and menu focused on resume-related actions; avoid adding unrelated features.
   - For any change that could affect filling behavior, remind the user to manually verify:
     - That all required fields are filled correctly
     - That no unrelated fields are overwritten

---

## Local Debugging Tips

- Open the target recruitment page with browser DevTools enabled:
  - Use the element inspector to check label text, placeholder values, and actual DOM structure to verify the matching strategies used in the script.
- After editing and saving the script in the Tampermonkey editor, simply refresh the target page to apply changes; no build step is required.
- When adjusting values in `profile.json`, edit it in a local editor first, then copy the entire JSON into the "Import personal information" dialog provided by the script.

---

## Change Management Recommendations

For substantial changes (e.g., refactoring fill strategies or adding support for entirely new classes of sites), the recommended workflow is:

1. Confirm the scope of changes and the list of target sites with the user.
2. Update the README to reflect new limitations, supported sites, or behavioral changes.
3. In the code:
   - Keep existing logic in place while gradually extending it, to reduce the risk of regressions.
   - Add short comments for each new site or strategy indicating its purpose and origin, making future maintenance easier.
