# Built-ins adopted (2026-11-20)
- [x] check_constraints: PASS — as the designer (unpolicied): UPDATE HARD ledger hours → "does not satisfy ledger_entries_never_change"; DELETE HARD ledger → "ledger_entries_never_deleted refuses it"; UPDATE request endDate < startDate → "request_dates_in_order"; employeeNumber change → "cannot change once set" (immutable, already in the model)
- [x] sensitive_leave_type: PASS — mert.hrm whoIsOut → system.access_logs row requests {type}; path-only read type.category was NOT logged (finding) → queries also project `type`
- [x] delegation: PASS — deniz.eng createDelegation (answer key) → burak.dev; anna.pm request → appears in burak's pto.myApprovals; burak denies → status denied, overriddenByHr false (flow approve/deny steps check auth.delegations); revokeMyDelegation as deniz → revokedAt set
- [x] notify_in_app: PASS — flow step notifyInApp → system.app_notifications "Time off denied: 2027-02-16 → 2027-02-16" for Anna
- [x] note: a run started before the flow update finished on the old version (first test: overriddenByHr true, no notification); the re-test on a new run passed
- [x] ui: tsc clean — Out of office card (managers) with Lend approvals / End now; approval card shows "For <name>" for lent approvals; badges never wrap
