# Settings verification
- [x] provider_default: PASS — SELECT system.email_providers → [{slug:'default', isActive:true}]
- [x] client_registration: PASS — system.getClientRegistration → {enabled:true}
- [x] roles: PASS — SELECT auth.roles → hr_admin, hr_manager, employee (lock:true)
- [x] smtp_env: PASS — system.createEnvKey returned key SMTP_HOST
