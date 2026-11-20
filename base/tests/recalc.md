# Recalculation verification (2026-11-20)
- [x] backdated_part_time: PASS — hr.changeJob can.dev employmentType part_time from 2026-09-01 → recalcRequired true + pending_recalcs (scope employee, TR, part_time); previewRecalc shows currentAccrued 12, 2 periods; pto.applyRecalc as mert.hrm → reversal −12 (recalc-rev:), flow pto.recalc re-accrued 2026-09-30 +6 and 2026-10-31 +6 under batch; status applied
- [x] policy_change_preview_only: PASS — pto.changePolicy TR VAC part_time rate 7 from 2026-10-01 → recalcRequired true, pending_recalcs open; ledger row count unchanged (36 → 36) until applied
- [x] country_transfer: DESCOPED — ruled out (see ledger Task 10 ruling); office/country change still opens an employee-scoped recalc that re-accrues under the new country's per-period policy
