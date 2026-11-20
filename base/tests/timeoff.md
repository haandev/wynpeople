# Time Off screens verification (2026-11-20)
- [x] partial_days_unit: PASS — bunx vitest run → partialDays 4 tests (1 h override with 2 h minimum → ok:false, error "at least 2 hours"; out-of-range; end before start) — suite 13/13
- [x] preview_live: PASS — as lena.hrm: Vacation 21–22 Dec 2026 → 2 days × 8 h, per-day toggle; 1 h shows "A partial day must be at least 2 hours."; 4 h → total 12 h, "after this request 228 h"
- [x] submit_live: PASS — Send request → "My requests" shows Vacation 21–22 Dec, 12 h, Pending; pto.myApprovals as ayse.hr (Lena's manager) lists "Time off: Lena Schmidt · 12 h · Christmas trip"
- [x] approve_live: PASS — anna.pm submitted 2027-01-11..12 (16 h) via MCP; Lena's Time Off page shows the card with "HR override" (approver is Deniz), bell = 1; Approve with note → request approved, decidedBy Lena, overriddenByHr true, ledger usage −16
- [x] balance_drops: PASS — pto.balances as anna.pm asOf 2027-01-31 → used 32, balance 288 (was 320)
- [x] calendar_live: PASS — month grid renders who's-out names (Zeynep 23 Nov) with office filter and month navigation
