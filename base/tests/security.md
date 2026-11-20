# Security verification (run in Task 5 Step 4 with seed users)
- [ ] raw_wql_cannot_read_salary: as IC and as direct manager, SELECT hr.compensation { payRate } → 0 rows
- [ ] manager_reads_reports_history_not_others: as deniz.eng, hr.employeeHistory for a report → periods; for a Sales IC → empty/refused
- [ ] hr_manager_office_scoped: as mert.hrm (Istanbul), SELECT hr.compensation for a Berlin employee → 0 rows; for Istanbul → rows
- [ ] termination_reason_hidden: as IC, terminated colleague terminationReason → null; as hr_admin → value
- [ ] address_hr_only: as IC, SELECT auth.addresses (others) → 0 rows; as hr_admin → rows
- [ ] employee_cannot_change_own_title: as IC, UPDATE hr.employees [self] { jobTitle } → refused
- [ ] ic_cannot_call_hire: as IC, hr.hireEmployee → 403 (call rule)
