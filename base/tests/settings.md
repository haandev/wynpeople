# Settings verification (2026-11-20)
- [x] build_checks: PASS — tsc clean, bunx vitest run 20/20, bunx wyndbase check --json app/src → []
- [x] hr_manager_read_only: PASS — /settings as lena.hrm: Organization shows the "Read-only" note and no Move/Deactivate buttons; sidebar hides Users & roles / Data retention / Audit log
- [x] policy_change_recalc: PASS (calls run as ayse.hr via MCP — the UI's EditPolicy makes the same calls) — changePolicy TR VAC full_time 13 h from 2026-09-01 → recalcRequired; listPendingRecalcs open[0] = the new one; previewRecalc; applyRecalc → status applied; Burak 24 h → 38 h (Oct 12 reversed, Sep + Oct 13 re-accrued)
- [x] recalc_scope_fixed: PASS — first run found 2 own bugs: preview listed all 15 full-time employees in every country; apply reversed Can's part-time accruals (−12). Fixed applyRecalc (employmentType in scope) and previewRecalc (country + employmentType, active only, elevated for the allowFilter bug); TR part-time preview now lists Elif and Can only; Can restored with an audited +12 h adjustment
- [x] holidays_drafts: PASS — pto.listHolidays DE 2027 → 9 drafts copied from 2026 (Easter dates need manual edit: Edit/Delete on drafts, Activate)
