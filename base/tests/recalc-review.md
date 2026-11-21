# Recalculations in HR's inbox, and request status as a state column (2026-11-21)
- [x] status_state_migration: 22 requests before (approved 5, canceled 10, denied 5, pending 2) = after; copy matched 22/22
- [x] trigger_moved: drop of the old column refused while closeApprovalOnCancel named it; after re-pointing, dropped
- [x] submit_cancel: zz.demo submits VOL 2027-03-15 → pending + approval interaction; cancels → canceled, interaction completed (trigger on the new column fired); second cancel → NOT_CANCELABLE
- [x] form_half: designer UPDATE status 'bogus' → "status does not satisfy its rule"
- [x] review_audience: new recalc (Berlin) → recalcReviews: ayse.hr 1, lena.hrm 1, mert.hrm 0, can.dev 0
- [x] dismiss_via_inbox: lena.hrm answers dismiss → flow → dismissRecalc → status dismissed, note appended
- [x] apply_via_inbox: ayse.hr answers apply (fromDate tomorrow, nothing to write) → applyRecalc → applying → recalc flow → applied; no ledger rows
- [x] ui: bell item and home Approvals "Review" open /settings?section=recalc; "In your inbox" badge; Apply and Dismiss answer the request; list polls until the flow finishes
- [x] cleanup: test recalcs, run record and test request deleted
- note: the TR Vacation PT recalc (queued 2026-11-20) predates the flow, so it has no inbox request; it is applied directly from Settings

# UAT preparation (2026-11-21)
- [x] bug found: pto.daily picked terminations by terminationDate alone. Deniz Kaya's test termination (20 Nov 11:46) was reverted to active two minutes later (status only), but terminationDate/reason/type stayed; at 00:15 on 21 Nov the nightly run paid out his 38 h of vacation, canceled a sick request and deactivated deniz.eng.
- [x] fix: pto.daily terminations step also requires status == 'terminated'; the mirror refresh step includes anyone not terminated. Check after the fix: the step selects only E-9999 (terminated, already deactivated); Deniz no longer.
- [x] repair (approved by the operator): deniz.eng reactivated; terminationDate cleared; terminationReason/Type periods removed; status period from 2026-11-20 reason "Termination undone (test data)"; ledger adjustment +38 h VAC (idemKey fix-term-undone:…). Deniz VAC balance 38 h again. The canceled 20 Nov sick request is left canceled (test data; SICK balance -8 h).
- [x] smoke, production (wynpeople.pages.dev) as ayse.hr: Home, My Info, People, Time Off, 13 reports, 9 settings pages, Can's six profile tabs; no failed request, no console error; Compensation and Add change visible on Can's Job tab.
- [x] smoke, server, acting as can.dev / deniz.eng / mert.hrm / lena.hrm: 20 page queries each run; the only refusals are rpt.salaryChanges for can.dev and deniz.eng (403, expected). withoutPayRaise: Deniz 0, Mert 6, Lena 5; salaryChanges 2026: Mert 3, Lena 1. rpt.terminations as can.dev: rows with terminationType/Reason null (cell rules).
- note: UI walkthrough as the other roles was not done in the browser: the production tab was signed in as Ayşe (operator's session), which was not signed out.

# Cleanup before UAT (2026-11-21)
- [x] bug found: pto.applyRecalc / dismissRecalc / reopenRecalc asserted `$p.off IN $context.teamIdsLed`; a policy-wide recalculation has no office, so nobody (an HR admin included) could apply or dismiss it directly. Fix: `$context.userId IS NULL OR 'hr_admin' IN $context.role OR $p.off IN $context.teamIdsLed`. Check: mert.hrm dismiss of the TR Vacation PT recalc → OUT_OF_SCOPE; ayse.hr → dismissed.
- [x] TR Vacation PT recalc (queued 2026-11-20): dismissed as ayse.hr, reason "Cleanup before UAT (test policy change)". No open or applying recalculation left.
- [x] TR biweekly pay periods: only one left (2027-12-20 → 2028-01-02; the rest of the 2027 set had been deleted, and this one is listed under 2028 because sets go by the year a period ends). Deleted with pto.deletePayPeriods(TR, biweekly, 2028). No TR policy uses biweekly. Left: TR monthly 48 (2024–2027, used by TR Vacation FT/PT), US semi-monthly 96, DE biweekly 26.

# UAT browser walkthrough, production (2026-11-21)
- [x] can.dev (employee): Home without HR widgets; Add widget offers no HR widget; My Info: Education on Personal, no Compensation / Add change on Job, Upcoming + Balance history on Time Off; request VAC 2027-02-08..09 with 9 Feb at 4 h → 12 h, Pending; Reports: no Terminations / Salary changes / Export log / Audit log, no Settings; Lena's profile: addresses, emergency contacts, education "Not visible to you".
- [x] deniz.eng (manager): signs in again after the repair; VAC 38 h; My approvals lists Can's request; approved with a note → approved, overriddenByHr false; Can's profile: job history and Time Off, no Compensation; Out of office: lent to Burak until 28 Nov, then End now → revokedAt set.
- [x] mert.hrm (HR manager, Istanbul): pay raise + length of service widgets; Can (Istanbul): Compensation, Add change, status change; Lena (Berlin): none; Settings: six sections, all read-only except Recalculations; Reports: HR reports, no Audit log; Time off balances: 9 rows, Istanbul only; CSV export → Export log row (ptoBalances, csv, 9).
- [x] cleanup: Can's request canceled as can.dev → reversals dated 8 and 9 Feb (+8, +4); signed back in as ayse.hr.
- [x] bug found: fmtDate took the first 10 characters of a timestamp (its UTC date), so Out of office showed "20 Nov – 28 Nov" for 21–28 Nov; same on account deactivation, recalculation queue and document dates. Fixed: a timestamp is formatted on the local clock. Test format.test.ts RED (20 Nov) → GREEN, suite 30/30.
- note: the browser asks hr.compensationHistory for non-HR viewers and gets 403 (hidden table, by design); Export log shows raw ISO timestamps. Lena was not walked through in the browser (same role as Mert; checked on the server).
