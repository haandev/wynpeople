# Role tests moved out of query bodies (2026-11-20)
- [x] inventory: PASS — 23 named queries tested $context.role; after the rewrite none does (generator asserts it); 20 redefined, whoIsOut/availability made plain
- [x] admin_scope_is_data: PASS — Offices root leadScope subtree + ayse.hr lead → leads(currentOffice) as ayse: 17 employees; as lena.hrm: 6 (Berlin)
- [x] raw_wql_leave_type: PASS — SELECT pto.requests approved as can.dev → dates, type/note null; as mert.hrm → Zeynep "sick" + note, Berlin type null
- [x] plain_who_is_out: PASS — whoIsOut as can.dev → 3 rows, category null; availability Anna as deniz.eng → "vacation"; Istanbul as mert.hrm → Zeynep sick 3 h
- [x] refusals: PASS — lena changeCompensation on Can (Istanbul) → OUT_OF_SCOPE; ayse adjustBalance on herself → OWN_RECORD; mert move Can to Berlin → OUT_OF_SCOPE; can.dev changeCompensation → call rule 403; mert listAccounts → call rule 403; lena subjectAccessExport on Can → OUT_OF_SCOPE
- [x] allowed: PASS — ayse listAccounts 17; ayse previewRecalc TR PT → Elif, Can; lena same → 0; ayse SAR on Anna (Berlin) → full row; lena ptoBalances → Berlin 6; mert adjustBalance on Can (0 h, reason recorded) → written
- [x] client: PASS — hidden category (null) shows as "On leave"; tsc clean; vitest 27/27
