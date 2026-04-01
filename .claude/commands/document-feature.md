You are a technical writer generating documentation for the feature: **$ARGUMENTS**

Follow this process exactly, in order. Do not skip steps.

---

## STEP 1 — Understand the feature

Search the codebase to find all files related to "$ARGUMENTS". Look for:
- Component files matching the feature name
- Library/utility files (lib/, utils/, hooks/)
- Type definitions
- Any tests
- Recent git commits mentioning the feature (run: `git log --oneline --all | grep -i "$ARGUMENTS"`)

List every file you find before proceeding.

---

## STEP 2 — Detect feature type

Classify the feature as one of:
- **frontend** — only touches components, hooks, styles, and types
- **backend** — only touches API routes, server actions, database, or server-side logic
- **full-stack** — touches both

Check indicators:
- `app/api/` or `server.ts` → backend
- `app/components/`, `app/hooks/`, client-side `useState`/`useEffect` → frontend
- Both present → full-stack

State the classification explicitly before writing any docs.

---

## STEP 3 — Detect screenshot opportunities

Scan the feature's UI components for distinct user-visible states. A screenshot opportunity exists at every:
- Page or route the user navigates to
- Modal, drawer, or dialog that opens
- Form the user fills in
- Success, loading, or error state
- Chart, table, or data visualization

List each screenshot opportunity by name (e.g. "Export Hub drawer — Templates tab") before writing docs.

---

## STEP 4 — Find related existing documentation

Check these locations for existing docs to cross-reference:
- `/docs/` (any subdirectory)
- `README.md`
- `CLAUDE.md`
- `code-analysis.md`
- Any other `.md` files in the repo root

List any related docs found.

---

## STEP 5 — Create directory structure

Run these commands:
```bash
mkdir -p docs/dev
mkdir -p docs/user/screenshots
```

---

## STEP 6 — Write Developer Documentation

Create the file: `docs/dev/[feature-name-kebab-case].md`

Use this exact structure:

```markdown
# [Feature Name] — Developer Documentation

> **Type:** frontend | backend | full-stack
> **Status:** implemented
> **Last updated:** [today's date]

## Overview

2–3 sentences: what the feature does and why it exists.

## Architecture

### Files & Responsibilities

| File | Role | Key exports |
|------|------|-------------|
| ... | ... | ... |

### Data Flow

Step-by-step description of how data moves through the feature.
Include function call chains where relevant.

### Type Definitions

Paste the actual TypeScript interfaces and types used, with inline comments explaining non-obvious fields.

### State Management

- What state exists and where it lives
- What is persisted (localStorage, server, etc.) vs ephemeral
- State machine diagram (text-based) if there are multiple states

### Key Functions / Components

For each major function or component, document:
- **Signature** — actual TypeScript signature
- **Purpose** — one sentence
- **Parameters** — each param with type and meaning
- **Returns / Side effects**
- **Edge cases handled**

### External Dependencies

| Library | Version | Why used | Bundle impact |
|---------|---------|----------|---------------|
| ... | ... | ... | ... |

### Error Handling

List every error case and how it is handled (or explicitly noted as unhandled).

### Performance Considerations

- Time complexity of key operations
- Memory usage patterns
- Any memoization or lazy-loading used
- Known bottlenecks

### Security Considerations

- Data exposed client-side
- Input validation present/absent
- Authentication/authorization requirements

### Extension Points

How a developer would extend or modify this feature. Include:
- Where to add a new export format
- Where to add a new destination / integration
- Configuration hooks

### Known Limitations

Honest list of what the current implementation doesn't handle.

### Related Documentation

- Link to user guide: `docs/user/[feature-name].md`
- Any other related docs found in Step 4
```

---

## STEP 7 — Write User Documentation

Create the file: `docs/user/[feature-name-kebab-case].md`

Use plain language. No jargon. Write as if explaining to someone who has never used the app before.

Use this exact structure:

```markdown
# How to [verb] [feature] — User Guide

> **Difficulty:** Easy | Medium | Advanced
> **Time required:** X minutes

## What is [feature name]?

One paragraph. What problem does this solve? Why would you use it?

## Before You Start

List any prerequisites:
- [ ] You need at least one expense added
- [ ] (any other requirements)

## Step-by-Step Instructions

### Step 1 — [Action verb + what to do]

[Clear sentence describing the action]

![Screenshot: [descriptive alt text]](screenshots/[feature]-step-1.png)
*Caption: [what the user should see after this step]*

> 💡 **Tip:** [optional helpful tip]

### Step 2 — [Next action]

...repeat for each step...

## [Feature-specific sections]

Add sections for each major sub-feature or option, for example:
- "Choosing an export format"
- "Filtering what gets exported"
- "Understanding the preview"

Each section follows the same Step-by-step → Screenshot pattern.

## Common Questions

**Q: [Most likely question a new user would ask]**
A: [Clear answer]

**Q: [Second most likely question]**
A: [Clear answer]

**Q: What happens if [edge case]?**
A: [What actually happens]

## Troubleshooting

| Problem | Likely cause | Fix |
|---------|-------------|-----|
| [symptom] | [cause] | [solution] |

## Related Guides

- Link to developer docs: `docs/dev/[feature-name].md`
- Any other related user guides found in Step 4
```

---

## STEP 8 — Validate cross-references

Confirm that:
1. The developer doc links to the user doc
2. The user doc links to the developer doc
3. Both files reference any related existing docs found in Step 4

---

## STEP 9 — Report

After creating both files, print a summary:

```
✅ Documentation generated for: $ARGUMENTS
   Type detected: [frontend/backend/full-stack]

   Files created:
   • docs/dev/[filename].md       ([line count] lines)
   • docs/user/[filename].md      ([line count] lines)

   Screenshot placeholders: [N] added to user guide
     [list each one by name]

   Cross-references:
   • Dev doc → User doc: ✓
   • User doc → Dev doc: ✓
   • Related docs linked: [list or "none found"]

   Known gaps:
   [list anything the command couldn't document because the code was unclear or missing]
```
