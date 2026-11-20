# PTO schema verification (2026-11-20)
- [x] policy_mode_check: PASS — annual_grant policy without annualGrantHours → CONSTRAINT_VIOLATION policy_mode_fields
- [x] ledger_insert_only: PASS — as ayse.hr (hr_admin): UPDATE pto.ledger → PERMISSION_DENIED; DELETE → PERMISSION_DENIED (plus PREVENT update/delete/updateHard/deleteHard TO ALL)
- [x] adjustment_needs_reason: PASS — adjustment without reason → CONSTRAINT_VIOLATION ledger_reason_required
- [x] policy_one_per_group: PASS (created) — unique (type, country, employmentType) withoutOverlaps; required country as text (see ruling)
