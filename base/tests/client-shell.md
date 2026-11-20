# Client shell verification (2026-11-20)
- [x] nav_tests: PASS — bunx vitest run (app) → 3/3 (navFor employee 5 tabs, hr_manager/hr_admin + Settings)
- [x] wyndbase_check: PASS — bunx wyndbase check --json app/src → []
- [x] login_redirect: PASS — opening http://localhost:5174 self-registered the client and redirected to the wynpeople sign-in on dev.wyndbase.dev
- [x] signed_in_shell: PASS — signed in as lena.hrm (user approved the host); consent for wynpeople-web granted; shell shows "Lena Schmidt" and the Settings tab; hr.me answered for the public client
