# Rules applied (Task 4)
- [x] hr/org/auth DCL applied: PASS — run_wql batches accepted; auth.decision_matrix rows present for hr.*, org.*, auth.addresses/emails/phone_numbers
- [x] self_read_smoke: PASS — hr.me as zz_test_a returns own row (directReports 0); SELECT hr.compensation as zz_test_a → 0 rows
