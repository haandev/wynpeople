# Settings verification
- [x] provider_default: PASS — SELECT system.email_providers → [{slug:'default', isActive:true}]
- [x] client_registration: PASS — system.getClientRegistration → {enabled:true}
- [x] roles: PASS — SELECT auth.roles → hr_admin, hr_manager, employee (lock:true)
- [x] smtp_env: PASS — system.createEnvKey returned key SMTP_HOST
- [x] provider_usable (added Task 5): PASS — probe job.sendEmail → {queued:true} after setting system.email_settings.defaultProvider. NOTE: provider_default above only checked the row existed; it did not prove mail could be sent (it could not until defaultProvider was set).
