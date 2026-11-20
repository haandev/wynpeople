# Decisions made during the build (rulings)

Collected from the execution ledger, in the order they were made. Each says what was decided, why, and what it costs if wrong.

- - T3↔T10: T3 NQs return recalcRequired; Ruling: T3 returns false until T10 adds pending_recalcs insert — keeps interface stable — cost: none.
- - Ruling: base tasks have no shell-runnable suite (verification is via MCP run_wql). Each base/tests/<area>.md records every case as '- [x] <name>: PASS — <evidence>'; task-done command is `! grep -nE '\[ \]|FAIL' base/tests/<area>.md` — cost: checks are evidence logs, not re-runnable automation.
- - Task 2: Ruling: wyndbase.config.json sources → ["app/src"]; base/*.wql are MCP-applied records (not all valid WQL files) — cost: base NQ files not type-checked by CLI; they are compiled by run_wql_dry instead.
- - Task 2: Ruling: org.tree returns unit rows only; roots via new org.roots NQ — tree shape is simpler for client — cost: client merges two lists. Ruling: moveUnit uses UPDATE EFFECTIVE FROM on auth.teams.parent directly instead of moveTeamFrom — same effect, one less unknown NQ — cost: none.
- - Task 3: Ruling: hireEmployee does not add a personal email (conditional insert needs reading auth.users after a named write) — personal email added later via profile — cost: one extra step for HR.
- - Task 3: Ruling: correctJob/correctStatus do not re-sync team memberships; nightly hr.syncApprovers (Task 9) reconciles memberships — cost: membership lag ≤1 day after a correction.
- - Task 3: Ruling: correctCompensation signature adds employeeId (EFFECTIVE ALL moment of $p leaks into later reads) — cost: client passes one more id.
- - Task 3: Ruling: superseded (corrected) versions are shown via rpt.auditLog (Task 11), not hr.employeeHistory (periods only) + hr.compensationHistory added — cost: two calls for full history.
- - Task 3: Ruling: org seed (legal entities, country settings, 11 units) created now to test Task 3; ids in base/seed/org-ids.json — cost: none (Task 5 reuses).
- - Task 3: Ruling: test employee ZZ-001 (zz_test_a@example.invalid) kept for Task 4 negative tests; removed in Task 5 — cost: one extra row until then.
- - Task 3: Ruling: the pulled model wynpeople.json (refreshed with `wyndbase pull` at each task end) is the source of record for tables/NQs/rules; base/queries/*.wql kept only where written by hand (org.wql) — cost: NQ text lives in JSON, less readable in diffs.
- - Task 4: Ruling: readEffective/read rules cannot read effective columns (engine refuses: cycle). Added plain mirrors hr.employees.currentOffice (team) + currentManager (user), written by hireEmployee/changeJob and new hr.refreshMirrors (no call grant; designer/flows only); all scope rules use the mirrors — partially reverts spec Rev 2 #1 — cost: mirrors lag for future-dated changes until nightly sync (Task 9).
- - Task 4: Ruling: security tests in base/tests/security.md run in Task 5 Step 4; Task 4 done-check is base/tests/rules-applied.md — cost: none.
- - Task 4: Ruling: hr.me returns directReports count instead of isManager+roles; client reads roles via sdk.account.getMyRoles — cost: client computes isManager.
- - Ruling: task-done test command is now base/tests/check.sh <files> (a `bash -c` form was blocked by a safety check) — cost: none.
- - Task 5: Ruling: mails sent with new elevated hr.sendSetPasswordLink (auth.sendPasswordReset runs policied, 404 for the designer); default provider set (system.email_settings) — the 15 mails from hireEmployee had silently not queued — cost: none; user-approved 15 mails delivered (job_queue: 15 completed).
- - Task 5: Ruling: added hr.setAccountActive (elevated) because auth.deactivateUser is policied and silently no-ops for designer/hr_admin — cost: one more NQ.
- - Task 5: Ruling: mirrors written with UPDATE HARD (versioning UPDATE + named result re-read writes NULL) — HARD also rewrites closed versions' mirror values — cost: mirror history not preserved (derived data).
- - Task 5: Ruling: security leaks fixed with PREVENT rules (cells + managed-table history); hr_manager reads all addresses/emails/phones globally (PRD: HR Manager may read) — cost: not office-scoped for contact data.
- - Task 5: Ruling: zz_test_a soft-deleted + deactivated; olivia.sales deactivated (terminated 2026-10-31) — cost: olivia can't sign in to test.
- - Task 6: Ruling: pto.policies.country is text with regex ^[A-Z]{2}$ (country type breaks withoutOverlaps with an opaque error) — cost: no country picker metadata on that column.
- - Task 6: Ruling: pto.policy_overrides not built (a link into a bitemporal policy pins one period; PRD asks only group assignment) — cost: no per-employee policy exception.
- - Task 6: Ruling: requests carry requester (user) + officeTeam (team) plain columns for interaction params/scoping; ledger keeps a 0-hour test adjustment row (insert-only table) — cost: one harmless row.
- - Task 6: Ruling: PTO types seeded now (VAC, SICK, PERS, VOL, UNPAID) — cost: none.
- - Task 7: Ruling: added pto.seq (0..399) helper table — WQL needs a table source to generate dates; used by generatePayPeriods/workingHours and as a conditional-insert trick — cost: 400 rows.
- - Task 7: Ruling: pto.balances returns SUMMARIZE BY type (type id, accrued/used/adjusted/expired/balance); client joins type names/pending/policy and computes projected — cost: client-side merge.
- - Task 7: Ruling: pto.leaveYear and pto.policyFor not built as separate NQs; submitRequest inlines policy lookup; leave-year logic assumes country leaveYearStartMonth=1 for annual grants in projection (all seeded countries use January) — cost: non-January leave years project grants imprecisely until Task 9 uses country_settings.
- - Task 7: Ruling: workingHours partial days passed as a JSON object {"YYYY-MM-DD": hours} (WQL has no array subscripting); dates returned as timestamps — client formats.
- - Task 7: Ruling: country codes compared via btrim(country::text,'"') or bound params (country type stores JSON; literal compare fails) — cost: verbose filters.
- - Task 8: Ruling: approve/deny wql steps read the approver from triggerData employee id (not from $r) — versioned UPDATE re-reads $r after closing the row; anna's first request's overriddenByHr repaired with UPDATE HARD — cost: none.
- - Task 8: Ruling: interaction carries an extra requestId param (for the client to link inbox items to requests) — cost: none.
- - Task 9: Ruling: accrual split into per-policy-group NQs (pto.accrueForPolicy / pto.grantAnnual / pto.runYearEnd / pto.onTermination) driven by flow pto.daily (repeater over policy groups; wql steps call NQs by bare name) — WQL has no free joins across employees×policies — cost: one flow step per group.
- - Task 9: Ruling: hr.syncApprovers merged into pto.daily (employees repeater → hr.refreshMirrors); terminations handled by an idempotent sweep (terminationDate <= today and no 'term:' ledger rows) that also deactivates the account — cost: termination effects land on the next daily run, not instantly.
- - Task 9: Ruling: year end only on Dec 31 (all seeded countries start Jan 1); carryover expiry after N months NOT implemented (carryoverExpiresAfterMonths stored, unused) — cost: carried hours never expire automatically.
- - Task 9: Ruling: termination mid-period gets no prorated final accrual (status terminated at period end excludes them) — cost: small under-accrual for leavers.
- - Task 9: Ruling: added reverse links pto.types.ledgerEntries / pto.types.policies (pairWith) so EACH sources can aggregate per type (EACH refuses SUMMARIZE) — cost: none.
- - Task 10: Ruling: previewRecalc is an estimate (current accrued since fromDate + number of periods), not an exact diff; exact recompute happens on apply (reverse + re-accrue via flow pto.recalc) — computing the exact diff without writing needs the accrual formula duplicated per row with a per-row EFFECTIVE moment, which WQL cannot express — cost: HR sees an estimate before applying.
- - Task 10: Ruling: country-change balance transfer (transfer_out/transfer_in) not implemented; employee-scoped recalc re-accrues under the new policy only — cost: balance of the old country's type stays on the old type.
- - Task 10: Ruling: pending_recalcs.status gained 'applying'; hr.changeJob now also changes employmentType/workerType and opens an employee-scoped recalc for back-dated employmentType/office changes; annual grants are not re-computed by recalc — cost: grant changes need a manual adjustment.
- Task 11: Ruling: rpt.ptoBalances returns one row per employee with nested balances[]/pending[] by type instead of flat employee×type rows — SUMMARIZE cannot join a second aggregate by group key — client flattens; cost if wrong: a reshaping helper in the client.
- Task 11: Ruling: rpt.leaveSummary and rpt.availability are not separate NQs; the client aggregates rpt.ptoUsageHistory (department/productTeam + per-day `days`) — avoids a second aggregate join; cost if wrong: large ranges load row-level data.
- Task 11: Ruling: added GRANT read on primary auth.emails to all signed-in users so the directory shows work emails — company directory need; cost if wrong: primary emails visible base-wide.
- Task 11: Ruling: added hr.employees.anonymizedAt and gdpr.retentionCandidates (elevated) for the retention flow; primary email kept on anonymize (PRD: non-primary removed); schema JSON files not written separately — wynpeople.json pull is the record.
- Task 11: Ruling: retention flow published but not run end-to-end (schedule trigger, no live candidate) — its NQ steps verified individually; cost if wrong: a flow wiring bug surfaces on the first monthly run.
- Task 12: Ruling: code-based TanStack routes (createRoute) in the plan's route files instead of the file-router plugin — fewer moving parts, same paths; cost if wrong: none functional.
- Task 12: Ruling: roles come from sdk.account.getMyRoles({ baseId }) (hr.me has no roles field), isManager = hr.me.directReports > 0; types output moved to app/wynpeople.wql.gen.d.ts via wyndbase.config.json.
- Task 13: Ruling: added NQ hr.profile (policied, one read for header + personal data) and changed pto.balances to group BY type, type.code, type.name — the plan's NQs returned the type id only and had no personal-data read; cost if wrong: none (additive fields).
- Task 13: Ruling: live check done as lena.hrm (Berlin HR) on Anna instead of ayse.hr — only lena's test password was given verbatim; IC compensation check done via run_wql as can.dev.
- Task 15: Ruling: approvals come from a new NQ pto.myApprovals over system.interactions (the SDK inbox item carries no request params) and are answered with system.answerInteraction on the typed tree; added pto.listTypes and elevated pto.previewHours (workaround for the allowFilter bug on direct pto.workingHours calls); rpt.availability not used — calendar reads pto.whoIsOut per month.
- Task 15: Ruling: two-user live check done as Lena in the UI + anna.pm/ayse.hr via run_wql targetUserId — only Lena's password is known.
- Task 17: Ruling: one /settings route with a section sidebar instead of ten route files — same pages, less routing; added read NQs (listPolicies/Holidays/PayPeriods/RetentionPolicies, hr.listAccounts/listUserRoles).
- Task 17: Ruling: the hr_admin policy-change check ran through MCP as ayse.hr (no password for Ayşe); fixed Task 10 recalc scoping bugs it exposed and restored Can with an audited +12 h adjustment — cost if wrong: Can's ledger shows one extra reversal/adjustment pair.
- Final: Ruling: I9 partial — a future-dated changeJob or a manager's termination still reaches approvals at the nightly mirror sync — cost: up to a day where a departed manager can still answer a request.

## Deferred minor findings (final review)

- CSV guard misses leading \t/\r and turns negative numbers into text
- previewHours caps 120 days; submitRequest/workingHours do not (pto.seq 400)
- submitRequest allows a partial day above hoursPerDay; error text hard-codes "2 hours"
- hr_manager reads export_events of all offices
- canEdit compares a single office; an HR manager leading two offices loses edit buttons in the second
- recalc reversals dated today while re-accruals are back-dated (past "as of" balances and cross-year caps)
- hr.setRoles allows an admin to drop their own hr_admin role or strip employee
