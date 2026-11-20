# Security verification (run 2026-11-20, Task 5 Step 4, run_wql targetUserId)
Users: can.dev = IC, deniz.eng = manager (Engineering), james.sales = unrelated IC, mert.hrm = hr_manager Istanbul, lena.hrm = hr_manager Berlin, ayse.hr = hr_admin.

- [x] raw_wql_cannot_read_salary: PASS — SELECT hr.compensation { payRate } as can.dev → 0 rows; as deniz.eng (manager) → 0 rows
- [x] hr_manager_office_scoped: PASS — as mert.hrm → 8 rows, all Istanbul (no Berlin/NY); as ayse.hr → 16
- [x] manager_reads_reports_history_not_others: PASS (after fix) — as deniz.eng: burak.dev jobTitle history = [Software Engineer, Senior Software Engineer]; as james.sales: burak.dev history = current period only. first run failed (deniz read anna.pm's full history; owner readEffective rule not applied to effective columns) → fixed with PREVENT read on each managed table for non-current periods outside self/manager/office-lead.
- [x] hr_manager_reads_office_history: PASS — as lena.hrm: felix.design status history [active, leave]; as james.sales: [leave] only
- [x] termination_reason_hidden: PASS (after fix) — as can.dev: olivia.sales terminationReason = null; as ayse.hr = 'resignation'. first run failed (role-scoped cell permits leave the cell open to callers with no permit) → fixed with PREVENT read ON hr.employees.terminationReason/Type/Note EXCEPT hr_admin FILTER NOT leads(currentOffice).
- [x] address_hr_only: PASS — can.dev added an address (auth.addMyAddress); as james.sales SELECT auth.addresses → 0 rows; as ayse.hr → can.dev's row
- [x] employee_cannot_change_own_title: PASS — as can.dev UPDATE hr.employees [person == self()] { jobTitle } → PERMISSION_DENIED (no update grant)
- [x] ic_cannot_call_hire: PASS — as can.dev hr.hireEmployee → PERMISSION_DENIED "This caller may not call hr.hireEmployee."
