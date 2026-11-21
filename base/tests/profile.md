# Home & profile verification (2026-11-20)
- [x] group_periods_unit: PASS — bunx vitest run → groupPeriods 4 tests (3 columns, two changing 2027-01-01 and one 2026-06-01 → 3 rows newest first, values carried forward, open newest row, missing columns) + nav 3 = 7/7
- [x] home_live: PASS — signed in as lena.hrm: Home shows "Vacation 240 h" card (after pto.balances grouped by type code/name), Who's out (empty this week), My approvals (0)
- [x] add_change_live: PASS — as lena.hrm (Berlin HR) on Anna Müller → Job → Add change: title "Senior Product Manager" from 2027-01-01, reason Promotion → new "(future)" row
- [x] correct_row_live: PASS — Correct on the 2027 row (amber "This edits history" banner) → title "Lead Product Manager"; History tab shows "Job title → Lead Product Manager — Title agreed with manager"
- [x] ic_no_compensation: PASS — hr.compensationHistory as can.dev for Anna and for himself → 403 readEffective refused; the client hides the table when no rows come back (retry off)
- [x] profile_policy: PASS — hr.profile for can.dev as elif.dev → addresses [] ; as can.dev himself → his address

# WDB-4326 — future-dated records on the Job tab (2026-11-21)
- [x] groupPeriods.test.ts: a reason that one change wrote on several columns shows once (RED: ['Promotion','Promotion'] → GREEN); currentIndex picks the newest row that has started (future rows skipped; -1 when all are future). Suite 37/37.
- [x] ui (localhost, ayse.hr, Elif Arslan): Employment status, Job information and Compensation each show "(future)" on the 31 Jul 2027 / 22 Nov 2026 rows; reasons once (Promotion, Hire); the emphasised row is the one in effect today (01 Apr 2024), not the future one.
