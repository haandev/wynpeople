# HR verification (2026-11-20, test employee ZZ-001 / zz_test_a)
- [x] hire_requires_fields: PASS — hr.hireEmployee w/o jobTitle → "Query requires the parameter jobTitle"; SELECT auth.users → [] (nothing written)
- [x] employee_number_immutable: PASS — UPDATE employeeNumber → CONSTRAINT_VIOLATION "employeeNumber cannot change once set."
- [x] change_creates_period: PASS — changeJob 2027-01-01 Senior Engineer → employees_jobTitle periods [2026-01-05..2027-01-01 Engineer, 2027-01-01.. Senior]; today reads Engineer
- [x] correct_keeps_old_version: PASS — correctJob periodStart 2026-01-05 'Fixed' → SELECT HARD shows closed 'Engineer' versions (_endAt set) + current 'Fixed'; still 2 current periods
- [x] correct_requires_period_start: PASS — correctJob periodStart 2026-02-01 → 409 NO_PERIOD_AT_START
- [x] termination_requires_reason: PASS — changeStatus terminated w/o reason → 400 TERMINATION_REASON_REQUIRED
- [x] illegal_transition: PASS — terminated → active → 409 ILLEGAL_TRANSITION
- [x] membership_follows_change: PASS — department change 2027-03-01 → Engineering membership ends 2027-03-01, Product starts
- [x] compensation_change_and_correct: PASS — changeCompensation splits period; correctCompensation keeps old version closed (SELECT HARD)
