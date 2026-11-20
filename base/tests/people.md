# People screens verification (2026-11-20)
- [x] build_tree_unit: PASS — bunx vitest run → buildTree 2 tests (5 rows, 2-level + orphan → roots [ceo, orphan]; cycle A↔B places both once) + earlier 7 = 9/9
- [x] directory_live: PASS — /people as lena.hrm: 13 active rows with department, location, manager, work email; filters + list/card toggle
- [x] org_chart_live: PASS — /people/org-chart: Ayşe → Lena, Mert; Deniz → 5 reports; Emily → James
- [x] hire_validation: PASS — Next on an empty Personal step → "Please fill in the required fields."
- [x] hire_live: PASS — (user approved the mail) lena.hrm hired Zz Demo, E-1016, Product Analyst, Product/Growth, Berlin, reports to Jonas, 62000 EUR/year → redirected to /people/01a1f7c5-439d…; rpt.employeeDirectory (Berlin) lists Zz Demo; system.job_queue sendEmail to you+zz.demo@example.com completed (providerMessageId set)
