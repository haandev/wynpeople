# People screens verification (2026-11-20)
- [x] build_tree_unit: PASS — bunx vitest run → buildTree 2 tests (5 rows, 2-level + orphan → roots [ceo, orphan]; cycle A↔B places both once) + earlier 7 = 9/9
- [x] directory_live: PASS — /people as lena.hrm: 13 active rows with department, location, manager, work email; filters + list/card toggle
- [x] org_chart_live: PASS — /people/org-chart: Ayşe → Lena, Mert; Deniz → 5 reports; Emily → James
- [x] hire_validation: PASS — Next on an empty Personal step → "Please fill in the required fields."
- [x] hire_live: PASS — (user approved the mail) lena.hrm hired Zz Demo, E-1016, Product Analyst, Product/Growth, Berlin, reports to Jonas, 62000 EUR/year → redirected to /people/01a1f7c5-439d…; rpt.employeeDirectory (Berlin) lists Zz Demo; system.job_queue sendEmail to you+zz.demo@example.com completed (providerMessageId set)

# WDB-4328 — Username is required on the new employee form (2026-11-21)
- [x] hireForm.test.ts: REQUIRED.Personal contains username (RED without it, GREEN with); usernameFromEmail('Beyza.Koroglu@wynenterprise.io') = 'beyza.koroglu'; nothing before an @. Suite 33/33.
- [x] server: hr.hireEmployee as ayse.hr with username "  " → 400 USERNAME_REQUIRED; no auth.users row written.
- [x] ui (localhost): label "Username *" with the hint "They sign in with it. Suggested from the work email…"; typing Test.Person@example.com fills test.person; clearing it and pressing Next stays on Personal with "Please fill in the required fields." and a red border.
- [x] found on the way: the red border on a missing field never showed (border-stone-300 from inputCls won over border-red-400) on any wizard field or combobox; now border-red-400! with a light red ring.

# WDB-4329 — dropdown reopen and layering (2026-11-21)
- [x] cause 1: the Combobox opened only on focus; after a pick the input keeps focus, so a second click did nothing. Fix: a click on the input opens it when closed.
- [x] cause 2: the list was absolutely positioned inside the filter bar (z-40); the directory's sticky table header uses backdrop-blur, which Safari paints above a nested z-index. Fix: the list renders in a portal on document.body, position fixed under the input (z-60, above modals at z-40), follows scroll and resize, opens upwards when there is no room below; outside-click ignores clicks inside the portal.
- [x] Chrome (in-app browser, localhost): People → Departments → pick Engineering (focus stays, list closes) → click the input again → list opens; the list is a child of body and the topmost element where the table header sits; inside the Job information change modal the list opens on top of the modal. Suite 37/37.
- note: not checked in Safari itself (no Safari in this environment); the portal removes the stacking context the Safari issue depends on.
