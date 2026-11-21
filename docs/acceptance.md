# wynpeople — acceptance checklist (2026-11-20)

Base `wynpeople` on dev.wyndbase.dev · client `app/` (run: `bun --cwd=app run dev`, http://localhost:5174).
Evidence files live in `base/tests/*.md`; every line there was run and read during the build.

## 1. PRD success metrics

| Metric | Check | Evidence | Result |
|---|---|---|---|
| Required fields enforced on hire | `hr.hireEmployee` without `jobTitle` is refused and writes nothing; the hire wizard blocks Next on empty required fields | `hr.md` hire_requires_fields · `people.md` hire_validation | ✅ |
| 100% of job/status/pay changes are effective-dated | Every change goes through `changeJob/changeStatus/changeCompensation` (new period) or `correct*` (edits a period, old version kept); History tab shows the timeline; `system.change_log` today: 1053 INSERT, 143 UPDATE rows | `hr.md` change_creates_period, correct_keeps_old_version · `profile.md` add_change_live, correct_row_live | ✅ |
| Status → PTO behaviour | Leave stops accrual unless the policy allows it; termination cancels future requests and pays out / forfeits per policy | `accrual.md` leave_no_accrual, termination_payout | ✅ (leave-accrual verified by filter, no seed employee on per-period leave) |
| Approval routing | Request goes to the current manager (follows reassignment); no manager → HR of the office; self-approval refused; HR answer marked as override | `approval.md` all · `timeoff.md` submit_live, approve_live | ✅ |
| Zero unauthorized salary access | Raw reads of `hr.compensation` by an employee and by a manager return 0 rows; the profile hides the table for non-HR (403 readEffective). `system.access_logs` on compensation: HR users (Lena, Mert), elevated service reads, and three non-HR entries (can.dev, deniz.eng, zz_test_a at 01:36–01:47) which are the security-test attempts that returned 0 rows | `security.md` raw_wql_cannot_read_salary · `profile.md` ic_no_compensation | ✅ — note: the access log records attempted column reads, not rows returned |
| Decimal precision | Ledger `hours` and request `totalHours` are decimal(10,4); proration stored as 9.2903 h, 220.0000 h | `accrual.md` accrual_prorated_hire, annual_grant_prorated_hire | ✅ |
| Exports logged | Every CSV/XLSX/PDF export writes `rpt.export_events` before the file is handed over; employees cannot read the log; every report call is in `system.invocations` | `reports.md` export_logged, audit_calls_logged · `reports-ui.md` export_each_format_live | ✅ |

## 2. Role walkthrough (you sign in; one browser profile per role)

> Superseded by the UAT script, [uat.md](uat.md) (2026-11-21), which covers every feature added since.

Test users: `<username>` with the password pattern you set. Open http://localhost:5174.

**Employee — e.g. `can.dev`**
- [ ] Home: Vacation balance card, Who's out, no approvals.
- [ ] My Info → Personal: edit preferred name / emergency contact and save.
- [ ] My Info → Job: history tables visible, **no Compensation table**, no Add change / Correct buttons.
- [ ] Time Off: request 2 days with one 4 h day; it appears as Pending; cancel it.
- [ ] People: directory shows work emails; open a colleague — no address/phone of theirs.
- [ ] Reports: only directory / balances (own) / usage / summary / availability / funnel; no Settings tab.

**Manager — `deniz.eng`** (manager of Can, Elif, Burak, Sophie, Anna)
- [ ] Home / bell: a request from a report shows up (submit one as Can first).
- [ ] Time Off: approve it with a note — no "HR override" badge.
- [ ] Open a report's profile: past job periods visible; still no Compensation.

**HR manager — `lena.hrm` (Berlin) or `mert.hrm` (Istanbul)**
- [ ] People → a person in your office: Compensation visible, Add change / Correct / Terminate available.
- [ ] Settings: all pages read-only; Recalculations: preview for your office.
- [ ] Reports: balances limited to your office; export CSV → appears in Export log.

**HR admin — `ayse.hr`**
- [ ] People → New employee: hire someone (a set-password mail is sent).
- [ ] Settings → Policies: edit a policy from a past date → preview opens → Apply; balances change.
- [ ] Settings → Holidays: Copy from previous year, fix a draft date, Activate.
- [ ] Settings → Users & roles: toggle a role; Data retention; Audit log shows recent changes.

## 3. Known gaps and decisions to review

- Live checks for HR admin, manager and employee flows were run through the Wyndbase admin connection acting as those users (only Lena's password was used in the browser); section 2 is where you confirm them in the UI.
- `rpt.ptoBalances` returns nested balances per employee (the client flattens it) — a Wyndbase limitation (SUMMARIZE cannot join a second aggregate by group key).
- `pto.previewHours` / elevated `pto.previewRecalc` exist only to work around the Wyndbase allowFilter bug on aggregate named results (findings file).
- The monthly retention flow is published but has not run end-to-end (no candidate until its schedule fires).
- PDF exports use jsPDF's built-in font: Turkish letters (ş, ı, ğ) may not render.
- One unexplained console "400" during the session; no feature was affected.
- Demo data was changed by the checks: Anna's title (Lead Product Manager from 2027-01-01), Zz Demo hired, Lena's pending 21–22 Dec request, Anna's approved Jan request, TR full-time vacation rate 13 h from 2026-09-01.
