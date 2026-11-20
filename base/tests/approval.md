# Approval flow verification (2026-11-20) — flow pto.requestApproval
- [x] manager_approves: PASS — anna.pm 16h request; deniz.eng (approver after reassignment) approves → status approved, decidedBy Deniz, usage rows [-8, -8]. (First version of the flow failed at runtime: `->>` / IS DISTINCT FROM unsupported in the wql step, not caught at save; fixed, the stuck request completed by hand with the same statements.)
- [x] self_cannot_answer: PASS — anna.pm answering her own request → 403 "This request is not addressed to you"
- [x] hr_override: PASS — ayse.hr denies james.sales request (approver emily.sales) → denied, overriddenByHr true, no ledger rows
- [x] reassign_moves_pending_request: PASS — hr.changeJob anna manager → deniz (today) → interaction params.approver = deniz; jonas.prod answering → 403
- [x] no_manager_falls_to_hr: PASS — zeynep.fin (approver NULL) → audienceSize 2 (ayse.hr + mert.hrm Istanbul lead); mert approves → approved, overriddenByHr true, usage -3
- [x] notifications: PASS — notifySubmit queued mail to you+jonas.prod@example.com (flow log jobId); notifyDecision runs after decisions
