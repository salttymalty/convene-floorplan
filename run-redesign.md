# Floor Plan Redesign — Claude Code Orchestration Prompt

Paste this into Claude Code from the `convene-floorplan/` directory. It will execute all phases using the Task tool for parallelism.

---

## Prompt (copy everything below this line)

You are orchestrating a multi-phase redesign of a Convene floor plan tool. All planning is already done — your job is execution.

Read these files first (DO NOT summarize them back to me, just absorb):
1. `FLOORPLAN-REDESIGN-PLAN.md` — the full plan with agent prompts and phase structure
2. `DESIGN-RESEARCH-BRIEF.md` — research findings informing decisions
3. `MULTIAGENT-IMPROVEMENT-PROMPT.md` — original diagnosis
4. `index.html` — the current app (this is the file we're improving)
5. `data/g2-conference.js` — event data (read-only, never modify)

Also read the design system skill at the path referenced in the plan (beautiful-first-design SKILL.md).

Execute the phases in order. Here are your rules:

**PHASE 1 — Architect (use Opus via Task tool)**
Spawn an Opus agent with the Agent 0 prompt from the plan. Give it all 5 files as context. It produces `REMEDIATION-CONTRACT.md`. Once it returns, show me a summary of the key decisions and ask for my approval before continuing.

**PHASE 2 — Structure (use Sonnet via Task tool)**
After I approve the contract, spawn a Sonnet agent with the Agent 1 prompt. Give it the contract + `index.html`. It outputs the restructured `index.html`. Save the output as `index-v2.html` (keep the original intact). Verify the file is valid HTML before proceeding.

**PHASE 3 — Color + Motion in parallel (use two Task tools simultaneously)**
Extract the `<style>` block from `index-v2.html` and save it as `temp-style.css`.
Extract the `<script>` block from `index-v2.html` and save it as `temp-script.js`.
Then spawn TWO agents simultaneously:
- Sonnet agent with Agent 2 prompt + contract + `temp-style.css`
- Sonnet agent with Agent 3 prompt + contract + `temp-script.js`
Wait for both. Save outputs as `temp-style-v2.css` and `temp-script-v2.js`.

**PHASE 4 — Merge + Warmth (use Sonnet via Task tool)**
Spawn a Sonnet agent with Agent 4 prompt. Give it: contract, `index-v2.html`, `temp-style-v2.css`, `temp-script-v2.js`, the research brief, and the design system skill. It produces the final merged `index.html`. Save as `index-v3.html`.

**PHASE 5 — Verification (use Opus via Task tool)**
Spawn an Opus agent with Agent 5 prompt. Give it: original `index.html`, `index-v3.html`, and the contract. It produces a PASS/FAIL report.

If PASS: copy `index-v3.html` to `index.html` (replacing the original — but keep `index-v2.html` and `index-v3.html` as backups).
If FAIL: show me the failures and ask which to fix.

After each phase, update `FLOORPLAN-REDESIGN-state.json` with the current status.

Start with Phase 1 now.
