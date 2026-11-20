# PTO core verification (2026-11-20)
Seed: 18 policies (TR monthly accrual, DE annual grant 240h with -16h limit, US semi-monthly, SICK unlimited TR/DE, VOL/UNPAID), pay periods TR 2024-2027 monthly / US 2024-2027 semi-monthly / DE 2026 biweekly, holidays 2026 TR/DE/US active, 2027 copied as draft.

- [x] pay_periods_generated: PASS — monthly 12, semi_monthly 24 (1-15, 16-EOM), biweekly 26 (first Monday 2026-01-05, last 2026-12-21..2027-01-03)
- [x] partial_day_minimum: PASS — sophie.dev VAC 2026-12-23 partial 1h → 400 PARTIAL_TOO_SHORT
- [x] holiday_not_counted: PASS — pto.workingHours sophie 2026-12-24..28 partial 24th=4h → days [24th 4h, 28th 8h] (25/26 holiday, 26/27 weekend)
- [x] negative_limit: PASS — DE limit 16h, balance 0: 3 days (24h) → 409 INSUFFICIENT_BALANCE; 2 days (16h) → pending request created
- [x] unlimited_skips_balance: PASS — sophie SICK 2027-02-01..03-26 (320h) → accepted
- [x] cancel_after_start_self_refused: PASS — can.dev cancel own approved past request → 403 FORBIDDEN; mert.hrm (Istanbul HR) → canceled, reversal rows written, balance back to 0
- [x] copy_holidays_draft: PASS — copyHolidays 2026→2027 TR 14 / DE 9 / US 9 draft; activateHolidays US 2027 as ayse.hr → 9 rows active
