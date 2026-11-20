# Reports & exports UI verification (2026-11-20)
- [x] export_unit: PASS — bunx vitest run: exportMeta (who/when ISO/filter.<key>), toCsv (quotes comma + doubled quote, `=SUM(A1)` → `'=SUM(A1)`, meta lines then blank then header), report aggregations (leaveSummary, availability, flattenBalances) — suite 20/20
- [x] scoped_report_live: PASS — Time off balances as lena.hrm lists only Berlin rows (6 rows incl. Sophie's pending SICK)
- [x] export_each_format_live: PASS — (user approved the downloads) as lena.hrm: CSV, XLSX, PDF of Employee directory → rpt.exportEvents shows three rows (csv, xlsx, pdf; rowCount 17; createdBy Lena Schmidt; filters recorded)
- [x] known_gaps: NOTED — one console "400" seen during the session (request not in the tab's network buffer, cause not identified; exports and reports unaffected); PDF uses jsPDF's built-in font, so Turkish letters (ş, ı, ğ) may not render; check was done as hr_manager (Lena), not hr_admin (no password for Ayşe)
