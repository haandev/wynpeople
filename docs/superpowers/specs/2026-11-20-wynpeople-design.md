# WynPeople — Tasarım Dokümanı

Tarih: 2026-11-20 · Base: `wynpeople` (sunucu: `https://dev.wyndbase.dev`) · Durum: onaylandı (2026-11-20), Rev 2 (plan doğrulaması)

## Rev 2 — plan doğrulamasından gelen değişiklikler (2026-11-20)

Plan aşamasındaki spike'lar §5.2–5.4'ü şu noktalarda değiştiriyor. Bu bölüm aşağıdaki metne göre önceliklidir.

1. **İş/durum alanları efektif kolon oldu.** `hr.job_info` ve `hr.employment_status` ayrı tablo değil; `hr.employees` (versiyonlu) üzerinde **efektif kolonlar** (`date`): `jobTitle`, `department`, `productTeam`, `office` (team), `manager` (user), `costCenter`, `legalEntity`, `status`, `employmentType`, `workerType`, `leaveType`, `terminationReason`, `terminationType`, `terminationNote`.
   - Her kolonun managed table'ı bitemporal ve `reason` kolonu taşıyor.
   - Değişiklik: `UPDATE EFFECTIVE FROM`. Düzeltme: `col: UPDATE { value }`, eski kayıt `AS OF` ile okunur.
   - Gerekçe: versiyonlu tabloda UPDATE değerindeki reverse-aggregate bir bug çıkardı. Ayrıca bilgi tabanı "başka satırların link verdiği kaydın değişen alanları efektif kolonda tutulur" diyor.
   - Böylece `current*` yansıtmaları ve onları güncelleyen sync **kalktı**; kurallar doğrudan `office`, `manager`, `status` kolonlarını okuyor.
   - UI'daki "Job Information" ve "Employment Status" tabloları, kolon dönemlerini aynı başlangıç tarihine göre gruplayarak gösterilir. `hr.compensation` ayrı bitemporal tablo olarak kalıyor (tamamı HR'a özel).
2. **Tek kalan yansıtma `hr.employees.approver`** (düz user kolonu). Interaction `follows` efektif kolon kabul etmediği için gerekli.
   - Yöneticiyi/durumu yazan named query'ler bu kolonu aynı transaction'da günceller. Değer, önce SELECT ile okunup bağlanır; motor, aynı satırın efektif kolonunu yazma değerinde okumayı reddediyor.
   - Gelecek tarihli değişiklikler için gece çalışan `hr.syncApprovers` flow'u (`wql` → `repeater` → `wql`) devreye girer. Team üyelikleri de aynı yolla senkronlanır.
3. **Stored function kullanılmıyor.** MCP'de function yazma tool'u yok; tahakkuk ve önizleme named query + flow `wql` adımlarıyla yapılıyor.
4. **Named query exposure `public`.** Tarayıcıdan kendini kaydeden (public) client'a `authenticated` 403 döndürüyor (NORMATIVE). Koruma tablo kurallarında ve elevated NQ'larda `GRANT call` ile.
5. **Doğrulananlar:**
   - `GRANT answer … FILTER officeTeam IN $context.teamIdsLed` yazılabiliyor.
   - `follows` düz user kolonunda çalışıyor.
   - Interaction → `system.answerInteraction` → flow `wql` uçtan uca çalışıyor.
   - Bitemporal tabloda unique `withoutOverlaps` + `UPDATE EFFECTIVE FROM` dönem bölüyor.
   - Kolonlarda `immutable: true` var; `employeeNumber` için kullanılacak.

## 1. Amaç ve neden

Tek şirketli, çok ülkeli bir organizasyon için CoreHR + PTO sistemi: çalışan ana verisi, organizasyon yapısı, PTO politikaları/tahakkuk/talepler/onaylar, raporlar/export ve rol tabanlı güvenlik. Kaynak gereksinimler kullanıcının verdiği altı PRD'dir (Employee Master Data, CoreHR+PTO Foundation, Org Structure, PTO, Reporting & Exports, Security).

Bu turun ikinci amacı, Wyndbase'in bir LLM tarafından ne kadar kolay keşfedilip kullanılabildiğini ölçmek. Her takılma `wyndbase-findings.md`'ye o anda yazılır. Bu yüzden Wyndbase'in kendi mekanizmaları (flow, interaction, efektif tarih, DCL, team'ler, SDK) **tercih edilir**; bir şeyin etrafından dolaşmak ancak gerçek bir duvar varsa yapılır.

Müşterinin önceki aracı BambooHR'dı. Ekran düzeni ve gezinme mantığı ona benzetilecek ki geçiş kolay olsun. Marka, logo, renk paleti ve metinler kopyalanmaz; yalnızca bilgi mimarisi örnek alınır.

## 2. Hedefler, kapsam dışı, anti-hedefler

**Hedefler**
- Oluşturmada zorunlu alanlar veritabanında zorlanır (NOT NULL + check), yalnızca UI'da değil.
- İş, rol ve organizasyon verisinin tamamı efektif tarihli; tarihçe kaybolmaz. "Düzeltme" mevcut kaydı değiştirir (eski hali `AS OF` ile okunabilir), "değişiklik" yeni efektif dönem açar.
- Durum geçişleri: Active ↔ Leave, Active → Terminated (efektif tarih ve sebep zorunlu); durum değişikliği ülke politikasına göre PTO davranışını tetikler.
- PTO: tür/politika (ülke × çalışma tipi), pay period başına tahakkuk, proration, carryover/max/expiry, yıllık tavan, kısmi gün (min. 2 saat), yönetici onayı + HR override, bildirimler, manuel düzeltme (sebep zorunlu), geriye dönük yeniden hesaplama (önizlemeli), resmî tatil takvimi (ülke/yıl, önceki yıldan kopyala, aktifleştir).
- Raporlar: çalışan dizini, PTO bakiyeleri, PTO kullanım geçmişi, departman/ürün ekibi izin özeti, müsaitlik takvimi. Filtreler: departman, ofis, istihdam durumu. Export: CSV, XLSX, PDF (metadata: generated_by, generated_at, filtreler). Her export loglanır.
- Güvenlik: RBAC + satır kapsamı + alan maskeleme, tamamı tablo seviyesinde (DCL). Rapor ve export'lar aynı kuralları otomatik miras alır.
- GDPR: tam audit izi, hassas alan okuma logu, subject access export, işten ayrılanlar için saklama/silme politikası.

**Kapsam dışı (PRD'den):** bordro, vergi, yan haklar, performans yönetimi, harici IdP, ABAC.

**Anti-hedefler (çalışsa bile başarısızlık sayılır)**
- Herhangi bir sunucu kodu (Node, edge function, proxy). Mimari "sıfır backend": Wyndbase + statik client.
- Güvenliğin yalnızca UI'da ya da yalnızca named query'de olması. Ham WQL gönderen bir kullanıcı da rapor/export'tan sızdıramamalı.
- Elle yazılmış HTTP çağrıları ya da tipler (SDK + typegen kuralı).
- Tarihçeyi ezen bir düzeltme/değişiklik akışı.
- `wynhr` base'ine ve memory belgelerine bakmak.

## 3. Kısıtlar

- Wyndbase `0.1.3-preview` (dev sunucu). Ürün olgun değil; bulunan hatalar raporlanır, workaround'lar dokümante edilir.
- Tüm iş mantığı Wyndbase'te: constraint → policy (DCL) → elevated named query → stored function sıralaması ("Choosing the door"). Zaman tabanlı işler zamanlanmış flow, insan onayları interaction adımı.
- Client: Vite + React + TypeScript, `@wyndbase/sdk` + `@tanstack/react-query`, tipler `wyndbase typegen` ile üretilir (CLI cihaz girişi kullanıcı onayıyla; olmazsa `model_download_url`).
- E-posta: base'e SMTP sağlayıcı (`HOST=192.168.1.31`, `PORT=25`, `SECURE=false`, `FROM_EMAIL=wyndb@developertools.com`). `config.host` bir env key adıdır (`SMTP_HOST`).
- Test kullanıcıları: `you+<username>@example.com`. Hesaplar `auth.createAccount` ile açılır, set-password maili gider, parolayı kullanıcı kendisi belirler. Claude parola girmez.
- Doğrulanmış platform davranışları (spike, 2026-11-20):
  - `system.change_log` düz, versiyonlu ve efektif tüm tabloları before/after ile logluyor.
  - `auth.teams` birden çok kök (orman) destekliyor.
  - one-to-one link'in reverse ucu senkron değil (bug). Team metadata'sı **many-to-one + unique** ile bağlanır.
  - `$x := <yazma> -> {…}` sonrasındaki okuma aynı gönderimde yeni satırı görmüyor (bug). Named query'lerde yazılanı `->` ile döndür ya da yazmayı adlandırma.
  - `drop_space` dış reverse kolonları bırakıyor (bug). Şema değişikliklerinde önce `drop_link`.
  - Interaction parametresinin `follows`'u efektif tarihli kolonu kabul etmiyor (dokümante). Bu yüzden onay yönlendirmesi düz bir "güncel yönetici" kolonunu takip eder (bkz. §5.3).

## 4. Yaklaşımlar

| | Yaklaşım | Artı | Eksi |
|---|---|---|---|
| **A (seçildi)** | İş mantığı tamamen Wyndbase'te (constraint, DCL, named query, flow, interaction, stored function), React client ince | Güvenlik tabloda, bypass edilemez; rapor/export kuralları otomatik miras alır; Wyndbase yüzeyinin neredeyse tamamı test edilir; sıfır işletme yükü | Tahakkuk gibi karmaşık hesaplar stored function'da; platform olgunlaşmadığı için bug riski |
| B | Ayrı Node backend, Wyndbase yalnızca veri katmanı | Tanıdık stack, karmaşık mantık kolay | Erişim kurallarının ikinci kopyası, "rapor katmanı bypass" riski büyür, SDK rehberine aykırı, ölçüm amacına zıt |

Kullanıcı A'yı seçti: "sıfır backend, tamamı Wyndbase + client app".

## 5. Veri modeli

Space'ler: `org`, `hr`, `pto`, `rpt` (rapor/export log), `gdpr`. Kişiler `auth.users`'tır. Ad, tercih edilen ad (`nickname`), e-postalar (`auth.emails`, etiketli `work`/`personal`), telefonlar (`auth.phone_numbers`) ve adresler (`auth.addresses`) orada tutulur ve kopyalanmaz.

### 5.1 Organizasyon (`org`)

- **Team ormanı** (`auth.teams`): üç kök, `Departments`, `Product Teams`, `Offices`. Departman, ürün ekibi ve ofisler bunların altında. `parent` efektif link olduğu için ağaç tarihçesi motor tarafından tutulur. Bir çalışan aynı anda bir departman, bir ürün ekibi ve bir ofis team'inin üyesidir (`auth.team_memberships`, efektif + versiyonlu).
- **`org.units`** (versiyonlu): `team` (many-to-one → `auth.teams`, **unique**, reverse `unit`), `kind` (choice: department | product_team | office), `code`, `costCenter` (efektif), `head` (user, efektif), `country` (ofis için, country tipi), `legalEntity` (link → `org.legal_entities`, ofis için), `status` (efektif choice: active | inactive). "Deactivate" = `status` efektif olarak `inactive`. Team silinmez, tarihçe kalır.
- **`org.legal_entities`** (versiyonlu): `name`, `country`, `registrationNo`.
- Departman/ürün ekibi başkanı `org.units.head` ile tutulur; aynı kişi ilgili team'de `kind: lead` üyeliği alır (DCL'de `leads(...)` için).

### 5.2 Çalışan ana verisi (`hr`)

BambooHR'daki "tablolu" bölümler (Job Information, Employment Status, Compensation) efektif tarihli satırlar olarak modellenir. Hepsi **bitemporal** (`effectiveDating: date` + `hasVersion: true`): değişiklik yeni dönem açar, düzeltme mevcut dönemi yerinde değiştirir ve eski kayıt `AS OF` ile okunur.

- **`hr.employees`** (versiyonlu, display field = `person`):
  - `person` (user, NOT NULL, unique)
  - `employeeNumber` (text, NOT NULL, unique; **değişmez**: `check onWrite unchanged(employeeNumber)`)
  - `hireDate`, `originalHireDate` (dateOnly, NOT NULL)
  - `terminationDate` (dateOnly, null) — işten çıkarma işlemi tarafından yazılır
  - *Güncel durum yansıtmaları* (sync tarafından yazılır, kullanıcı yazamaz; satır kapsamı ve onay yönlendirmesi için gerekli): `currentManager` (user), `currentApprover` (user, §5.4), `currentDepartment`/`currentProductTeam`/`currentOffice` (team), `currentStatus` (choice), `currentEmploymentType` (choice), `country` (country, ofisten türetilir).
- **`hr.job_info`** (bitemporal): `employee` (link, NOT NULL), `jobTitle` (NOT NULL), `department` (team, NOT NULL), `productTeam` (team), `office` (team, NOT NULL), `manager` (link → `hr.employees`), `costCenter`, `legalEntity` (link), `changeReason` (NOT NULL). Unique `(employee)` **withoutOverlaps**: çalışan başına bir anda tek dönem.
- **`hr.employment_status`** (bitemporal): `employee`, `status` (active | leave | terminated), `employmentType` (full_time | part_time), `workerType` (employee | contractor), `leaveType` (status=leave ise), `terminationReason` (choice), `terminationType` (voluntary | involuntary), `terminationNote`, `comment`. Check'ler: `status <> 'terminated' OR (terminationReason IS NOT NULL AND terminationType IS NOT NULL)`, `status <> 'leave' OR leaveType IS NOT NULL`. Unique `(employee)` withoutOverlaps.
- **`hr.compensation`** (bitemporal): `employee`, `payRate` (decimal), `currency`, `payType` (salary | hourly), `payPeriod`, `changeReason` (NOT NULL). Hassas: `sensitive: always` (her okuma loglanır).
- **`hr.emergency_contacts`** (versiyonlu): kişinin kendi düzenleyebildiği alan, ad/ilişki/telefon. Bunlar kullanıcı olmayan kişiler olduğu için kendi kolonları var. "Employee (limited self-edit)" gereksinimini burası ve `auth.users` profili karşılar.

**Değişiklik ve düzeltme yazma kapıları** (named query, `authenticated`, policied; erişimi DCL belirler):
- `hr.changeJobInfo { employeeId, effectiveFrom, ...fields, reason }` → `INSERT/UPDATE EFFECTIVE FROM`.
- `hr.correctJobInfo { periodId, ...fields, reason }` → dönemi yerinde değiştirir (eski versiyon kapanır, `AS OF` ile okunur).
- Employment status ve compensation için de aynı ikili var.
- UI iki eylemi ayrı butonlarla sunar: "Değişiklik ekle (yeni tarih)" ve "Bu kaydı düzelt". Düzeltme bir onay ekranından geçer. PRD'deki "yanlış sınıflandırma" riski böyle azaltılır.

**İşe alma:** `hr.hireEmployee` (elevated, `GRANT call TO hr_admin, hr_manager`). Tek transaction'da şunları yapar: `auth.createAccount` (set-password maili gider), `hr.employees`, ilk `job_info`, ilk `employment_status` (active), ilk `compensation`, üç team üyeliği. Zorunlu alan eksikse NOT NULL/check yüzünden tamamı geri alınır.

**Durum geçişleri:** `hr.changeStatus { employeeId, effectiveFrom, status, ... }` (elevated, HR rolleri). İzin verilen geçişleri `ASSERT` ile zorlar: active↔leave, active→terminated, leave→terminated. Terminated → `hr.employees.terminationDate` yazılır, kullanıcı hesabı efektif tarihte deaktive edilir (`auth.deactivateUser`, zamanlanmış flow ile), PTO etkileri tetiklenir (§5.4).

### 5.3 Güncel durum senkronu (sync)

Efektif tablolar gelecek tarihli dönem tutabildiği için `hr.employees.current*` yansıtmaları iki yoldan güncellenir:
1. Bugünü kapsayan bir yazmada, ilgili tablonun custom trigger'ı aynı transaction'da `current*`'ı günceller.
2. Gece 00:15'te (Europe/Istanbul) zamanlanmış bir flow, o gün başlayan dönemleri okuyup `current*`'ı ve team üyeliklerini (`moveTeamMember`) günceller.

Onay yönlendirmesi `hr.employees.currentManager`'ı `follows` ile takip eder. Böylece yönetici değişince bekleyen onaylar otomatik yeni yöneticiye geçer (PRD başarı metriği).

### 5.4 PTO (`pto`)

- **`pto.types`** (versiyonlu): `code`, `name`, `category` (vacation | sick | personal | custom), `paid` (bool), `color`, `active`.
- **`pto.policies`** (bitemporal; politika değişikliği yeni dönem açar, eski kurallar tarihçede kalır):
  - `type`, `country`, `employmentType`
  - **`accrualMode`** (kullanıcı kararı: politika başına mod): `per_period` | `annual_grant` | `unlimited`
    - `per_period`: `accrualHoursPerPeriod` (decimal 4 hane) + `payFrequency` (monthly | semi_monthly | biweekly); tahakkuk pay period sonunda.
    - `annual_grant`: `annualGrantHours`; izin yılının ilk günü tek satır `accrual` (yıl ortasında işe girişte kalan aylara oranlanır).
    - `unlimited`: bakiye tutulmaz; yalnızca `usage` defteri (raporlama için). Bakiye kontrolü, tavan ve carryover uygulanmaz.
  - `prorateFirstPeriod` (bool), `accrualCapPerYear`, `maxCarryover`, `carryoverExpiresAfterMonths`
  - **`negativeBalanceLimitHours`** (decimal, varsayılan 0; kullanıcı kararı)
  - `minPartialHours` (varsayılan 2), `hoursPerDay` (varsayılan 8)
  - `accrueDuringLeave` (bool), `onTermination` (payout | forfeit)
  - Check: mod alanlarıyla tutarlılık (`per_period` ⇒ rate+frequency dolu, `annual_grant` ⇒ grant dolu).
  - Unique `(type, country, employmentType)` withoutOverlaps.
- **`org.country_settings`** (versiyonlu; kullanıcı kararı: izin yılı ülke başına ayarlanabilir): `country` (unique), `leaveYearStartMonth` (1–12, varsayılan 1), `leaveYearStartDay` (varsayılan 1), `timezone`, `weekendDays` (int[], varsayılan [6,7]). Tavan, carryover, expiry ve annual grant bu ülkenin izin yılına göre hesaplanır. Yıl sonu işi her gün çalışır ve o gün izin yılı biten ülkeleri işler.
- **Politika ataması** "çalışan grubu" kuralıyla yapılır: çalışanın `country` + `currentEmploymentType` değerine uyan politikalar ona aittir. İstisnalar için `pto.policy_overrides` (efektif: employee, type, policy).
- **`pto.pay_periods`**: `country`, `frequency`, `periodStart`, `periodEnd`, `payDate`; unique `(country, frequency, periodStart)` (builder kararı: bir ülkede birden çok frekans olabilir; tahakkuk politika frekansına uyan takvimi kullanır). Üretici named query: `pto.generatePayPeriods { country, frequency, year }`.
- **`pto.holidays`**: `country`, `year`, `date`, `name`, `status` (draft | active). `pto.copyHolidaysFromYear { country, fromYear, toYear }` taslak üretir, `pto.activateHolidays { country, year }` aktifleştirir.
- **`pto.ledger`** (yalnızca ekleme yapılan defter; `PREVENT update, delete` herkes için):
  - `employee`, `type`, `kind` (accrual | usage | adjustment | carryover | expiry | reversal | payout | forfeit | transfer_out | transfer_in)
  - `hours` (decimal, 4 hane), `payPeriod` (link), `request` (link), `policyVersion` (versionId), `reason` (adjustment/reversal'da NOT NULL, check), `recalcBatch` (uuid).
  - Bakiye = toplam. Ondalık hassasiyet decimal ile korunur.
- **`pto.requests`** (versiyonlu):
  - `employee`, `type`, `startDate`, `endDate`, `days` (jsonb: gün başına saat), `totalHours`, `note`
  - `status` FSM: pending → approved | denied | canceled, approved → canceled
  - `approver` (user, `follows` için ayrıca flow parametresi), `decidedBy`, `decidedAt`, `decisionNote`, `overriddenByHr` (bool)
  - Check: her gün `hours >= minPartialHours` ya da tam gün; `endDate >= startDate`; hafta sonu ve aktif tatiller saymaz (named query hesaplar).
- **Talep oluşturma:** `pto.submitRequest`. Örtüşme ve kısmi gün kurallarını `ASSERT` ile kontrol eder ve `pending` olarak yazar. **Bakiye kontrolü (kullanıcı kararı):** talebin başlangıç tarihine kadar *öngörülen* bakiye (mevcut + o tarihe kadar beklenen tahakkuk/annual grant − pending ve onaylı kullanımlar) − talep ≥ −`negativeBalanceLimitHours`. `unlimited` türlerde kontrol yok.
- **Onay akışı (flow `pto.requestApproval`):**
  - Tetik: `pto.requests` INSERT.
  - Interaction adımı `managerApproval`. Parametreler: `approver` (uuid, `follows: hr.employees.currentManager` çalışan satırında), `requester` (uuid), `officeTeam` (uuid).
  - DCL: `GRANT answer … TO ALL {delegatable} FILTER approver == $context.userId`; `GRANT answer … TO hr_admin`; HR manager için ofis kapsamı (`officeTeam IN $context.teamIdsLed`, yazım sırasında doğrulanacak); `PREVENT answer … FILTER (requester == $context.userId) ?? false`.
  - Cevaba göre condition → `wql` adımı status'u yazar; onaylanırsa `usage` defter satırları eklenir. `sendEmail` ile talep sahibine ve yöneticiye bildirim gider; SDK Inbox eklentisi uygulama içi gösterir.
- **Onaylayan yoksa (builder kararı):** `currentManager` boşsa ya da yöneticinin `currentStatus`'u `active` değilse, sync `hr.employees.currentApprover`'ı departman başkanına (`org.units.head`), o da yoksa ya da talep sahibinin kendisiyse hr_admin grubuna ayarlar. Interaction parametresi `currentManager` yerine bu **`currentApprover`** kolonunu takip eder; hr_admin override her durumda açıktır. Böylece hiçbir talep sahipsiz kalmaz.
- **İptal (builder kararı):** `pto.cancelRequest`. Çalışan `pending` talebini her zaman, `approved` talebini yalnızca `startDate`'ten önce iptal edebilir. Sonrasını yalnızca HR (hr_admin / ofis hr_manager) iptal eder. Onaylı bir talep iptal edilirse ters `usage` satırları (`reversal`) yazılır. Kurallar DCL'de (FSM transition grant + FILTER) ve named query'de birlikte durur.
- **Tahakkuk (zamanlanmış flow `pto.accrualRun`, her gün):** Bugün biten pay period'ları bulur ve stored function `pto.computeAccruals`'ı çağırır. Function, çalışan × politika için proration, durum (leave/terminated), tavan ve carryover'ı hesaplar; flow'un `wql` adımı sonucu deftere yazar. Her çalıştırma `pto.accrual_runs` tablosuna (başarı, süre, istisnalar) kaydedilir; bu, PRD'deki "accrual job success/latency/exceptions" analitiğini karşılar.
- **Geriye dönük yeniden hesaplama:** `pto.previewRecalculation { scope, fromDate }` (function, yazmaz, fark listesi döndürür) ve `pto.applyRecalculation` (aynı batch: eski accrual satırlarına `reversal`, yenilerine `accrual`, ortak `recalcBatch`). `scope` bir politika ya da tek bir çalışan olabilir.
  - **Tetikleyiciler (kullanıcı kararı: önizlemeli):** politika değişikliği; ayrıca geçmiş tarihli HR değişiklikleri (`employmentType` değişimi, ülke/ofis değişimi, `hireDate` düzeltmesi, geçmiş tarihli leave/terminated dönemi). Bu değişiklikleri yazan named query'ler değişikliği kaydeder ve sonuçta `recalcRequired: true` + önizleme döndürür. UI aynı ekranda "Yeniden hesaplamayı uygula" adımını gösterir; uygulanmamış önizlemeler `pto.pending_recalcs` tablosunda HR'ın işler listesinde kalır.
  - **Ülke değişimi:** değişiklik tarihinde eski politikanın kalan bakiyesi bir `transfer_out` / `transfer_in` satır çiftiyle yeni ülkenin aynı kategorideki türüne taşınır. Kategori eşleşmezse HR önizlemede hedef türü seçer.
- **Yıl sonu carryover/expiry:** yıllık zamanlanmış flow, politika kurallarıyla `carryover` ve `expiry` satırları yazar.
- **Durum değişikliğinin PTO etkisi:** `hr.employment_status` değişiminde tetiklenen flow `pto.onStatusChange`:
  - leave: politika `accrueDuringLeave=false` ise o dönem tahakkuku function'da 0 olur, ayrıca yazım gerekmez.
  - terminated: gelecekteki pending/approved talepler iptal edilir, kalan bakiye politikaya göre `payout` ya da `forfeit` satırıyla kapanır.
- **Bakiyeler:** `pto.myBalances` ve `pto.balances { filters }` (named query). Tür başına accrued / used / remaining / projected (pending + yıl sonuna kadar beklenen tahakkuk) döner.

### 5.5 Raporlar ve export (`rpt`)

- Raporlar named query: `rpt.employeeDirectory`, `rpt.ptoBalances`, `rpt.ptoUsageHistory`, `rpt.leaveSummary` (departman/ürün ekibi), `rpt.availability` (tarih aralığı).
- Hepsi `audit: 'arguments'` ile tanımlanır, böylece her çağrı ve filtreleri `system.invocations`'a düşer.
- Hepsi policied: kullanıcının satır/alan kuralları otomatik uygulanır. Maaş ve kişisel adres alanları yalnızca HR rolleri için gelir; diğerlerinde motor null döndürür.
- Filtreler: `department`, `office`, `status` (opsiyonel `?=` parametreleri).
- Export client'ta üretilir: CSV (yerel), XLSX (SheetJS), PDF (jsPDF + autotable). Dosyanın başına metadata satırları eklenir: generated_by, generated_at, filtreler.
- Export eylemi `rpt.logExport { report, format, filters, rowCount }` ile `rpt.export_events`'e yazılır (kullanıcı ve zaman damgası motor tarafından). Bu tablo herkes için insert-only, okuması yalnızca HR. "Security events" için ayrıca `access_logs` var.

### 5.6 Güvenlik modeli

**Roller** (`auth.roles`, design role, `lock: true`): `hr_admin`, `hr_manager`, `employee`. "Direct manager" bir rol değil, ilişkidir: `currentManager == self`. Her kullanıcı `employee` rolündedir.

**Kapsam:**
- `hr_admin`: global.
- `hr_manager`: kendi ofisleri. Ofis team'inde `lead` üyeliği verilir; satır kuralı `leads(currentOffice)`. **Builder kararı:** hr_manager yalnızca kendi ofisine işe alır. Kendi ofisi içinde departman ve yönetici değiştirebilir, ama çalışanı başka ofise taşıyamaz (taşıma yalnızca hr_admin; `hireEmployee` ve `changeJobInfo` bunu `ASSERT` + DCL FILTER ile zorlar). `org.*` yazma yetkisi yalnızca hr_admin'de; hr_manager okur. hr_manager'ı olmayan ofisleri (New York) hr_admin kapsar.
- Direct manager: `self(currentManager)` (doğrudan raporlar).
- Çalışan: `self(person)`.

**Kural tablosu (özet):**

| Veri | hr_admin | hr_manager | direct manager | employee (self) | diğer çalışan |
|---|---|---|---|---|---|
| `hr.employees` temel (ad, ünvan, departman, ofis, yönetici) | R/W | R/W ofis | R | R | R (dizin) |
| `hr.job_info` tarihçe | R/W | R/W ofis | R | R | — |
| `hr.employment_status` | R/W | R/W ofis | R (sebep hariç) | R (sebep hariç) | — |
| `terminationReason/Type/Note` (cell) | R | R ofis | — | — | — |
| `hr.compensation` | R/W | R/W ofis | — | — | — |
| `auth.addresses`, kişisel e-posta | R | R | — | R/W (kendi) | — |
| `pto.requests` | R/W + override | R/W ofis + override | R + onay | R/W kendi | — (takvimde yalnızca "izinde") |
| `pto.ledger` | R + adjustment | R ofis + adjustment | R | R kendi | — |
| `pto.policies/types/holidays/pay_periods` | R/W | R | R | R | R |
| `org.*` | R/W | R | R | R | R |
| `rpt.export_events` | R | R ofis | — | — | — |

- Kurallar DCL olarak `run_wql` ile yazılır ve her rol için `targetUserId` ile doğrulanır.
- Hassas kolonlar: `compensation.payRate` ve `terminationReason` `sensitive: always`, adres/e-posta okumaları `access_logs`'tan izlenir.
- Not: PRD'de "Access logs for sensitive personal data reads" maddesinin üstü çizili, yani kapsam dışı. Yine de platform hassas kolon okumalarını zaten logluyor; ek iş yapılmayacak.

### 5.7 Audit ve GDPR (`gdpr`)

- **Audit:** `system.change_log` tüm tablolarda before/after tutuyor (doğrulandı). UI'da çalışan profili için "History" sekmesi `FILTER row == $id OR ownerRow == $id` ile okunur (yalnızca HR). Named query çağrıları `system.invocations`'a, export'lar `rpt.export_events`'e yazılır.
- **Subject access export:** `gdpr.subjectAccessExport { employeeId }` (elevated, yalnızca HR). Kişinin tüm verilerini (profil, iş/durum/ücret tarihçesi, PTO talepleri/defter, export/erişim kayıtları) tek JSON'da toplar; client bunu JSON + PDF olarak indirir ve export loglanır.
- **Saklama:**
  - `gdpr.retention_policies` (ülke başına `retainYearsAfterTermination`).
  - Aylık zamanlanmış flow süresi dolan eski çalışanları bulur ve bir interaction ile HR admin'e anonimleştirme onayı sorar.
  - Onaylanırsa: kişinin profil adı anonimleştirilir, adres/telefon/e-postalar silinir, hesap deaktive edilir. Ücret satırları `DELETE EFFECTIVE ALL` ile kapatılır; bitemporal tarihçe fiziksel olarak silinmez. Bu sınır UI'da açıkça belirtilir.

## 6. Client uygulaması

- **Stack:** Vite, React 18, TypeScript, TanStack Router (dosya tabanlı) + TanStack Query, Tailwind CSS, Radix tabanlı kendi bileşenlerimiz, SheetJS, jsPDF. Tipler `bunx wyndbase typegen`. Giriş `browserSession({ autoRegister: true })` + `signInRouteOptions`. Inbox eklentisi.
- **Bilgi mimarisi (BambooHR'dan esinlenmiş):** üst global bar (logo, global arama, inbox zili, kullanıcı menüsü), ana sekmeler **Home · My Info · People · Time Off · Reports · Settings** (Settings yalnızca HR).
  - **Home:** karşılama, kendi PTO bakiye kartları + "Request Time Off", "Who's Out" (bugün/hafta), bekleyen onaylarım (inbox interactions), duyuru alanı yok (kapsam dışı).
  - **My Info / Çalışan profili:** sol sütunda fotoğraf, ad, ünvan, departman, ofis, yönetici, iletişim. Sağda sekmeler: **Personal** (profil, adresler, e-postalar, acil durum kişileri; self-edit), **Job** (Employment Status, Job Information ve Compensation tabloları; her biri efektif tarih sıralı tarihçe, "Değişiklik ekle" / "Düzelt" eylemleri, compensation yalnızca HR), **Time Off** (bakiyeler, talepler, defter/geçmiş, HR için "Adjust balance"), **History** (yalnızca HR, change_log). HR için "Terminate", "Change status" eylemleri.
  - **People:** dizin (liste/kart, departman/ofis/durum filtreleri), org chart (`currentManager` ağacı), yeni çalışan ekleme sihirbazı (HR).
  - **Time Off:** takvim görünümü (müsaitlik), takım talepleri, onay kuyruğu.
  - **Reports:** standart raporlar, filtreler, CSV/XLSX/PDF export.
  - **Settings (HR):** Org (departman/ürün ekibi/ofis/tüzel kişilik), PTO türleri, politikalar (önizlemeli yeniden hesaplama), pay period'lar, resmî tatiller (yıl kopyala/aktifleştir), roller ve kullanıcılar, saklama politikaları.
- **Dil:** UI İngilizce. BambooHR deneyimine benzerlik bunu gerektiriyor; i18n altyapısı açık bırakılır (builder'ın kararı).

## 7. Seed verisi

- Ülkeler: TR (İstanbul ofisi), DE (Berlin ofisi), US (New York ofisi). Her biri bir tüzel kişilik.
- Departmanlar: Engineering, Product, People (HR), Sales, Finance. Ürün ekipleri: Core Platform, Mobile, Growth.
- ~15 çalışan (username → `you+<username>@example.com`), roller:
  - 1 hr_admin
  - 2 hr_manager (İstanbul, Berlin)
  - 3 yönetici
  - geri kalanı çalışan
  - en az biri part-time, biri leave, biri terminated
- PTO: Vacation/Sick/Personal + bir custom tür; her ülke × full/part-time için politika; 2026 + 2027 pay period'ları; 2026 resmî tatilleri (TR/DE/US) ve 2027 için kopyalanmış taslak.
- Geçmiş için bazı çalışanlara geriye dönük job/compensation değişiklikleri ve bir düzeltme örneği.

## 8. Doğrulama yaklaşımı

- Her DCL kuralı her rol için `run_wql` + `targetUserId` ile pozitif/negatif test edilir (ör. yönetici maaş okuyamıyor, HR manager başka ofisi göremiyor, rapor sorgusu maaşı null döndürüyor).
- Akışlar uçtan uca çalıştırılır: talep → interaction → onay → defter; yönetici değişince bekleyen talebin yeni yöneticiye geçmesi; geriye dönük politika değişikliği → önizleme → uygulama → bakiye.
- Client, uygulamanın kendisi tarayıcıda çalıştırılarak test edilir. Seed kullanıcıların parolalarını kullanıcı set-password mailinden belirler; Claude onların adına giriş yapmaz, yalnızca kullanıcı oturum açtığında ekranları birlikte doğrularız.

## 9a. Builder check sonrası verilen kararlar

| Soru | Karar | Kimin |
|---|---|---|
| Hak kazanma modu | Politika başına `per_period` / `annual_grant` / `unlimited` | Kullanıcı |
| Eksi bakiye / talep kontrolü | Talep tarihine kadar öngörülen bakiye + politika başına eksi limit (varsayılan 0) | Kullanıcı |
| İzin yılı | Ülke başına ayarlanabilir (`org.country_settings`) | Kullanıcı |
| Geriye dönük HR değişikliklerinde PTO | Önizlemeli yeniden hesaplama; ülke değişiminde bakiye transferi | Kullanıcı |
| Pay period takvimi | (ülke × frekans) anahtarlı | Builder |
| Yöneticisiz onay | `currentApprover`: yönetici → departman başkanı → hr_admin | Builder |
| İptal kuralları | pending: her zaman; approved: başlangıçtan önce çalışan, sonra yalnızca HR | Builder |
| hr_manager kapsamı | Yalnızca kendi ofisi; ofis dışına taşıma ve `org.*` yazma hr_admin'de | Builder |
| Named query exposure | `public` + tablo kuralları + `GRANT call` (doğrulanacak) | Builder |

## 9. Builder'a bırakılanlar

- Bileşen kütüphanesinin detayları, renkler (BambooHR'a benzemeyen kendi paleti), ikonlar.
- Named query isimleri ve parametre adlarının son hali; tablo kolonlarının ikincil alanları.
- Tahakkuk function'ının iç algoritması (proration formülü: aktif gün / dönem gün).
- Raporların kolon setleri ve PDF yerleşimi.
- Zamanlanmış flow saatleri (yukarıdakiler öneri).

## 10. Açık doğrulama noktaları (plan aşamasında test edilecek)

1. SDK ile kendini kaydeden (public) client'ın `authenticated` named query'leri çağırıp çağıramadığı. "Stored functions" ve "Published API" makaleleri `authenticated`'ın public client'a 403 döndürdüğünü söylüyor, "Queries" makalesi ise oturum açmış çağıran için `authenticated` diyor. **Varsayılan karar:** client'ın çağırdığı named query'ler `public` exposure ile tanımlanır. Koruma tablo kurallarında (policied) ve elevated olanlarda `GRANT call` ile sağlanır; anonim erişim base'te kapalı kalır. Test `authenticated`'ın çalıştığını gösterirse ona geçilir.
2. Interaction `answer` FILTER'ında `officeTeam IN $context.teamIdsLed` kullanılabiliyor mu? Kullanılamıyorsa HR manager override için ofis başına parametre/rol kurgusu.
3. `auth.createAccount` set-password mailinin bu base'te public URL gerektirip gerektirmediği.
4. Bitemporal tabloda unique `withoutOverlaps` + düzeltme akışının birlikte çalışması.
5. Custom trigger'dan efektif tablo okuyup `hr.employees.current*` yazılabilmesi.
6. Stored function'ın zamanlanmış flow'dan çağrılıp sonucunun `wql` adımında deftere yazılması.
