# Wyndbase Bulguları — wynpeople

**Özet:** Bug: 14 · Eksik özellik: 4 · Keşfedilebilirlik: 12 · Duvar: 1 (toplam 31 bulgu; 2026-11-20 kabul öncesi yeniden sayıldı)

---

## `choice` kolonuna verilen `transitions` sessizce kabul ediliyor ama hiç uygulanmıyor
- **Görev:** Efektif `hr.employees.status` kolonunda durum geçişlerini (active↔leave, →terminated) her yazıcıyı bağlayan bir kurala çevirmek.
- **Kategori:** Bug
- **İlk deneme:** `update_column { status, metadata: { transitions: [{ name, from, to }, …] } }`. Bulgu raporundaki "effective column transitions bind every writer" ifadesine güvendim.
- **Sonuç:** Kayıt başarılı, metadata yönetilen tabloya da yazıldı; ama tasarımcı olarak `terminated → active` geçişi engellenmedi (Olivia'ya geçersiz bir dönem yazıldı, düzeltmem gerekti).
- **Sonraki denemeler:** "Declaring an effective column" makalesi: `transitions` yalnız `type: "state"` kolonlarında `timeline_…` kısıtını türetiyor. Bizim kolon `choice`; tür değiştirmek drop+add (geçmiş kaybı) demek.
- **Çözüm / Workaround:** Yönetilen tabloya `$prior` okuyan check: `hr.employees_status` üzerinde `status_timeline_transitions` (onWrite). Test: aynı geçersiz yazım reddedildi. Etkisiz `transitions` metadata'sı kaldırıldı.
- **Durum:** Workaround ile çözüldü
- **Öneri:** `transitions` sadece `state` kolonlarına kabul edilmeli; `choice` (ya da başka tür) kolona verilince hata dönmeli — şu an tasarımcıyı korunduğuna inandırıp korumuyor. Var olan bir `choice` kolonunu geçmişi koruyarak `state`'e çevirmenin yolu da belgelenmeli.

---

## `hasComments` MCP ile açılamıyor: `update_table` ve `design_table` anahtarı sessizce düşürüyor
- **Görev:** İzin taleplerinde çalışan–yönetici yazışması için yerleşik satır yorumlarını (`metadata.hasComments: true`, `_comments`) açmak.
- **Kategori:** Duvar
- **İlk deneme:** `update_table { _id: pto.requests, metadata: { hasComments: true } }`. "Choosing the door" makalesi bunu birebir söylüyor: "Through MCP: `update_table` with `metadata.hasComments: true`".
- **Sonuç:** Yanıt `{ metadata: { hasVersion: true } }`; `hasComments` yok. `SELECT pto.requests { _comments }` → `Column "_comments" not found in model`. Hata da uyarı da yok.
- **Sonraki denemeler:** `{ hasVersion: true, hasComments: true }` ile tekrar → aynı. `design_table` şemasına baktım: tablo metadata'sında yalnız `hasVersion, effectiveDating, transient, allowDynamicColumns, displayFieldId, baseLanguage, runtimeTranslations` var ve açıklaması "a key it does not name is dropped" diyor. "Comments on a row" makalesi yalnız tablo yaratırken verilen JSON'u gösteriyor.
- **Çözüm / Workaround:** Yok (MCP üzerinden). Doküman bu durumda kendi yorum tablonu kurmayı öneriyor; yerleşik özelliği denemek istediğimiz için kurmadım.
- **Durum:** Açık
- **Öneri:** `update_table`/`design_table` şemasına `hasComments` eklenmeli; tanınmayan bir metadata anahtarı sessizce düşürülmek yerine hata (ya da en azından `warnings`) döndürmeli. Makale ile araç şeması uyumlu hale getirilmeli.

---

## `auth.listGrantedDelegations` / `listReceivedDelegations` parametresiz çağrılınca sessizce boş liste dönüyor
- **Görev:** "Out of office" ekranında yöneticinin verdiği vekâletleri listelemek.
- **Kategori:** Keşfedilebilirlik
- **İlk deneme:** Deniz olarak `auth.listGrantedDelegations {}` çağırdım. Tipte `userId?: unknown` opsiyonel göründüğü için çağıranın kendi vekâletlerinin döneceğini bekledim (çağıran = kendisi). Deniz'in o anda aktif bir vekâleti vardı.
- **Sonuç:** `[]`, hata yok.
- **Sonraki denemeler:** `{ userId: <Deniz> }` ile çağırınca vekâlet geldi. Ayrıca `delegatorName` / `delegateName` görünen ad değil kullanıcı adı (`deniz.eng`) dönüyor.
- **Çözüm / Workaround:** İstemci `userId: me.userId` gönderiyor; isimler rehberden eşleniyor.
- **Durum:** Çözüldü (zorlanarak)
- **Öneri:** `userId` verilmezse çağıranın kendisi varsayılmalı ya da parametre zorunlu yapılmalı; sessizce boş liste dönmemeli. `*Name` alanları adı (`name`) dönmeli ya da `username` diye adlandırılmalı.

---

## `sensitive` işaretli bir link kolonu, link üzerinden okunduğunda (`type.category`) erişim kaydına düşmüyor
- **Görev:** Hastalık izni türünü kimin gördüğünü kaydetmek için `pto.requests.type` (link) kolonunu `sensitive: 'always'` yaptım.
- **Kategori:** Bug
- **İlk deneme:** `update_column { metadata: { sensitive: 'always' } }`, sonra Mert (İstanbul İK) olarak `pto.whoIsOut` çağırdım; bu sorgu `category := type.category` okuyor. "Every read of it (a projection, a filter, a sort…)" ifadesinden dolayı kayıt bekledim.
- **Sonuç:** `system.access_logs`'ta `requests` için kayıt yok; Zeynep'in "sick" bilgisi okundu ama loglanmadı.
- **Sonraki denemeler:** Aynı kullanıcıyla `SELECT pto.requests { type, c := type.category }` → bu sefer `{type}` için kayıt düştü. Yani link kolonu yalnız kendisi projeksiyona girince loglanıyor, link üzerinden yol (path) okumada loglanmıyor.
- **Çözüm / Workaround:** Raporlayan sorgulara `typeName := type` eklendi; böylece her okumada link kolonu da okunuyor ve kayıt düşüyor.
- **Durum:** Workaround ile çözüldü
- **Öneri:** Sensitive bir link kolonundan geçen her yol okuması (`type.category`, `type.name`) o kolonun okuması sayılıp `system.access_logs`'a yazılmalı; aksi halde denetim, yol ile okuyan sorgularda sessizce boşluk bırakıyor.

---

## Kullanıcı bir NQ'yu doğrudan çağırınca, NQ gövdesindeki aggregate adlı sonuca yapılan filtre "allowFilter" ile reddediliyor
- **Görev:** İzin talep diyaloğunda gün gün çalışma saatlerini önizlemek (`pto.workingHours`, policied, `public`).
- **Kategori:** Bug
- **İlk deneme:** İstemciden `wyndbase.query.pto.workingHours({...})` çağırdım. Aynı NQ, `pto.submitRequest` içinden iç içe çağrıldığında çalışanlar için sorunsuz çalışıyordu (Task 6 testleri), hata mesajı da "named-query bodies are exempt" diyor.
- **Sonuç:** Çalışan (lena.hrm) doğrudan çağırınca: `Column "ds" of "hol" does not allow filtering: the columns it reads cannot be traced (aggregate)` (PERMISSION_DENIED). UI'da sessizce "çalışma günü yok" olarak göründü.
- **Sonraki denemeler:** Filtreyi `== ANY($hol.ds)` yerine `strpos($hol.ds, …) == 0` ile yazdım → aynı hata. `NOT EXISTS (SELECT …)` gramerde yok.
- **Çözüm / Workaround:** Aynı gövdeyle `elevated` bir `pto.previewHours` (çalışanı `$context.userId`'den bulur, sadece kendi saatleri) + rol başına `GRANT call`. `pto.workingHours` iç kullanım için olduğu gibi kaldı.
- **Durum:** Workaround ile çözüldü (ikinci kez: Task 17'de `pto.previewRecalc` aynı hatayla düştü — `$offs.ts` aggregate'i; o da elevated + açık HR ASSERT ile çözüldü)
- **Öneri:** allowFilter kapısı, kullanıcının yazdığı metne değil yalnız NQ çağrısına uygulanmalı (mesajın söylediği gibi NQ gövdesi muaf olmalı); doğrudan çağrı ile iç içe çağrı aynı davranmalı.

---

## SDK'nın React tip kaydı yorumu yanlış paket adını gösteriyor (`@wyndb/sdk/react`)
- **Görev:** İstemci kabuğunda `<WyndbaseProvider sdk={wyndbase}>`; istemci `.use(Inbox)` ile genişletilmiş.
- **Kategori:** Keşfedilebilirlik
- **İlk deneme:** "Building an application with the SDK" makalesindeki örneği aynen uyguladım (`<WyndbaseProvider sdk={wyndbase}>`). Makale "Register the client's type once" diyor ama nasıl yapılacağını ayrı sayfaya bırakıyor.
- **Sonuç:** `tsc`: `Type '{ use: …; inbox: InboxHandle<…> }' is missing … config, wqlQuery …` (eklentili istemci `wyndbaseSDK<any>`'ye atanamıyor). Hata kayıt gerektiğini söylemiyor.
- **Sonraki denemeler:** `react.d.ts` içindeki JSDoc `declare module '@wyndb/sdk/react' { interface Register { sdk: typeof sdk } }` diyor; paket aslında `@wyndbase/sdk`. `'@wyndbase/sdk/react'` ile augment edince derlendi.
- **Çözüm / Workaround:** `declare module '@wyndbase/sdk/react' { interface Register { sdk: typeof wyndbase } }`.
- **Durum:** Çözüldü (zorlanarak)
- **Öneri:** JSDoc'taki modül adı `@wyndbase/sdk/react` olarak düzeltilmeli; makaledeki React örneği `Register` bloğunu doğrudan içermeli (özellikle `.use(Inbox)` ile — inbox bölümü bunu öneriyor, ikisi birlikte kullanılınca hata kaçınılmaz).

---

## Sorgu içinde "çağıran şu role sahip mi?" kontrolünün yazımı bulunamıyor
- **Görev:** `rpt.ptoBalances` raporunu satır düzeyinde kapsamak: hr_admin herkesi, hr_manager yalnız kendi ofisini, çalışan kendini ve ekibini görsün (çalışan rehberi herkese açık olduğu için satır kuralı tek başına yetmiyor).
- **Kategori:** Keşfedilebilirlik
- **İlk deneme:** `FILTER hasRole('hr_admin') OR leads(currentOffice) OR self(person) OR self(currentManager)`. Kurallarda `self()`, `leads()`, `guest()` fonksiyonları olduğu için rol için de `hasRole()` benzeri bir fonksiyon bekledim.
- **Sonuç:** `No such function as: hasRole()`. Hata alternatif önermiyor.
- **Sonraki denemeler:** `'hr_admin' == ANY($context.roles)` → "takes a list, which binds only with a declared array type". `$context.roles(type: text[])` ile çalıştı.
- **Çözüm / Workaround:** `'hr_admin' == ANY($context.roles(type: text[]))`.
- **Durum:** Yanlış yön — sonradan düzeltildi (2026-11-20). "Choosing the door" ve "DCL statements: common variants" makaleleri bunu açıkça söylüyor: rol koşulu gövdeye `$context.role` ile yazılmaz; rolü kuralın kendisi taşır (`GRANT … TO hr_manager FILTER leads(…)`, `PREVENT … EXCEPT hr_admin`), elevated sorgu için `GRANT call … TO <rol>`. Gövdedeki `ASSERT` yalnız parametrelere/okunan veriye bağlı koşullar için. Bilgi keşfedilebilirdi; hata benim (makaleyi okumadan `$context.role` yoluna gittim).
- **Öneri:** (Düzeltilmiş) `hasRole()` eklemek yerine: `No such function: hasRole()` hatası "rol koşulunu kuralın rolüne yaz (`GRANT … TO <rol>`), elevated sorguda `GRANT call`" diye yönlendirmeli. Asıl öneri buydu; en azından "No such function" hatası bilinen bir isme benziyorsa `$context.roles(type: text[])` yazımını önermeli. `$context` alanlarının tipleri (roles text[], teamIdsLed uuid[]) tek bir referans sayfasında listelenmeli.

---

## SUMMARIZE içinde grup anahtarına göre bağlı tablodan ikinci bir toplam alınamıyor
- **Görev:** `rpt.ptoBalances` için çalışan × izin türü başına tek satır: defterden accrued/used/remaining, bekleyen taleplerden pending.
- **Kategori:** Eksik özellik
- **İlk deneme:** `SUMMARIZE pto.ledger { …, pending := max(employee.timeOffRequests[sum(totalHours) FILTER status == 'pending' AND type == $row.type]) } BY employee, type`. `$row`'un dış satırı okumak için belgelendiğini gördüğüm için grup satırında da çalışmasını bekledim. Ayrıca `BY employee, type, office := employee.currentOffice` ile grup anahtarına ad vermeyi denedim.
- **Sonuç:** `$row … not allowed … Here the statement reads no row`; `BY` içinde `:=` parse hatası.
- **Sonraki denemeler:** Çalışan satırından başlayıp iki iç içe `SUMMARIZE` (ledgerEntries BY type.code, timeOffRequests BY type.code) kullandım; düz satır yerine iç içe diziler döndü.
- **Çözüm / Workaround:** Rapor `hr.employees` üzerinden `balances: [...]`, `pending: [...]` döndürüyor; istemci düzleştiriyor.
- **Durum:** Workaround ile çözüldü
- **Öneri:** SUMMARIZE'ın grup çıktısında grup anahtarına (`$group.type` gibi) erişim, ya da iki özetin anahtar üzerinden birleştirilmesi (SQL'deki join of aggregates) desteklenmeli; BY anahtarlarına takma ad da eklenmeli.

---

## Flow kaydı `wql` adımlarının sorgusunu derlemiyor; hata ilk çalıştırmada çıkıyor
- **Görev:** İzin onay akışında, onay sonrası kullanım satırlarını deftere yazan `wql` adımı.
- **Kategori:** Bug
- **İlk deneme:** `create_flow` ile adımı `($item.el ->> 'hours')` ve `overriddenByHr: $by::uuid IS DISTINCT FROM $e.a` içeren bir sorguyla kaydettim, `update_flow { isDraft: false }` ile yayınladım. Tool açıklaması "nodes / trigger validated against the driver's schemas on receipt" dediği ve `{{ }}` ifadeleri kayıtta doğrulandığı için WQL'in de kayıtta derleneceğini bekledim.
- **Sonuç:** Kayıt ve yayın uyarısız geçti. Gerçek bir talep onaylandığında adım `Parser diagnostics failed … mismatched input '->'` hatasıyla düştü. Kullanıcının kararı alınmıştı ama talep `pending`'de takılı kaldı (çalıştırma `failed`); elle onarmak gerekti.
- **Sonraki denemeler:** Sorguyu önce `run_wql_dry` ile derledim (`jsonb_array_element` de izinli değil → `jsonb_extract_path_text(days, n::text, 'hours')`), sonra akışı güncelledim.
- **Çözüm / Workaround:** Her `wql` adımını kaydetmeden önce `run_wql_dry` ile derlemek.
- **Durum:** Workaround ile çözüldü
- **Öneri:** `create_flow`/`update_flow`, `wql` adımlarını (parametre tipleriyle birlikte) kayıtta derleyip hata ya da en azından `warnings` döndürmeli; yayın (`isDraft: false`) derlenmeyen bir adımla reddedilmeli. Bu, insan onayı alındıktan sonra bozulan bir süreç demek; kullanıcıya en pahalı anda çıkıyor.

---

## `country` tipli kolon bir metin literal'iyle karşılaştırılamıyor ("invalid input syntax for type json")
- **Görev:** Pay period'ları ve tatilleri ülkeye göre filtrelemek (`FILTER country == 'TR'`).
- **Kategori:** Keşfedilebilirlik
- **İlk deneme:** `SELECT pto.pay_periods {...} FILTER country == 'TR'`. "Choosing a choice column" makalesi choice/country değerlerinin anahtar olarak düz metin karşılaştırıldığını söylüyor; aynısını bekledim.
- **Sonuç:** `invalid input syntax for type json` (INVALID_PARAMS). `FILTER country::text == 'TR'` ise hata vermeden 0 satır döndürdü, çünkü `country::text` = `'"TR"'` (JSON string).
- **Sonraki denemeler:** Parametreyle (`FILTER country == $c`, `$c = "TR"`) çalıştı. Named query içinde iki country kolonunu karşılaştırmak için `btrim(country::text, '"')` kullandım.
- **Çözüm / Workaround:** Ülke değerlerini hep parametreyle bağlamak; kolon-kolon karşılaştırmada `btrim(country::text, '"')`.
- **Durum:** Workaround ile çözüldü
- **Öneri:** `country` tipi literal karşılaştırmayı choice gibi desteklemeli ya da derleyici literal'i otomatik JSON'a çevirmeli. `describe_column_type(country)` çıktısı, değerin içeride JSON olarak tutulduğunu ve nasıl karşılaştırılacağını söylemeli.

---

## `country` tipli kolon `withoutOverlaps` unique kısıtında opak hata veriyor
- **Görev:** PTO politikalarında (bitemporal) "aynı tür + ülke + çalışma tipi için bir anda tek politika" kuralı.
- **Kategori:** Bug
- **İlk deneme:** `add_constraint { type: 'unique', columnNames: ['type','country','employmentType'], withoutOverlaps: true }`. `country` kolonu `country` tipinde. Tool açıklaması "Per-moment unique: the key may repeat across non-overlapping periods. Effective-dated tables only" diyor; tablo efektif tarihli olduğu için çalışmasını bekledim.
- **Sonuç:** `The database could not run this statement.` (INVALID_REQUEST), detay yok.
- **Sonraki denemeler:** Kolonları tek tek denedim: `[type]` ✓, `[type, employmentType]` ✓ → sorun `country` tipinde (muhtemelen GiST operator class'ı yok).
- **Çözüm / Workaround:** `country`'i düşürüp `text` + `regex ^[A-Z]{2}$` kuralıyla yeniden ekledim; kısıt kuruldu.
- **Durum:** Workaround ile çözüldü
- **Öneri:** `country` (ve diğer doğrulanmış metin tipleri) için exclusion constraint desteği (btree_gist/uygun opclass) eklenmeli; olmayacaksa `add_constraint` net bir hata vermeli: "column type country cannot be part of a withoutOverlaps key".

---

## Efektif kolon geçmişi, sahibin `readEffective` kuralına (ve PREVENT'ine) uymuyor
- **Görev:** Bir çalışanın iş geçmişini (efektif kolon dönemleri) yalnızca kendisinin, doğrudan yöneticisinin, ofis HR manager'ının ve hr_admin'in görmesi.
- **Kategori:** Bug (veri sızıntısı)
- **İlk deneme:** `GRANT read ON hr.employees TO ALL FILTER NOT guest()` (dizin) + `GRANT readEffective ON hr.employees TO ALL FILTER self(person) OR self(currentManager)` + rol kapsamlı readEffective grant'leri. "Effective-dated tables" makalesi efektif kolon dönemleri için "the actor needs `readEffective` … the access follows its owner" diyor; sahibin `readEffective` kuralının dönem okumalarını satır bazında sınırlamasını bekledim.
- **Sonuç:** `targetUserId` = deniz.eng (Engineering yöneticisi) olarak `SELECT hr.employees { h := (SELECT EFFECTIVE ALL jobTitle {value}) }` ve `SELECT EFFECTIVE '2024-06-01' hr.employees { jobTitle }` sorguları, raporu olmayan anna.pm'in (Product) tüm dönemlerini döndürdü. Ardından eklediğim `PREVENT readEffective ON hr.employees EXCEPT hr_admin FILTER NOT (self(person) OR self(currentManager) OR leads(currentOffice))` de etkisiz kaldı.
- **Sonraki denemeler:** Makaledeki "write a role-scoped `PREVENT read` on the managed table" ipucunu izledim: managed table'a (`hr.employees_jobTitle`) yalnızca güncel olmayan dönemleri gizleyen bir PREVENT yazdım.
- **Çözüm / Workaround:** Her managed table için `PREVENT read ON hr.employees_<col> EXCEPT hr_admin FILTER (_effectiveFrom > current_date OR (_effectiveTo IS NOT NULL AND _effectiveTo <= current_date)) AND NOT (self(owner.person) OR self(owner.currentManager) OR leads(owner.currentOffice))` (11 kolon). Dizin güncel değeri herkese göstermeye devam ediyor; geçmiş yalnızca kapsamdakilere açık.
- **Durum:** Workaround ile çözüldü
- **Öneri:** Versiyonlu (efektif tarihli olmayan) bir sahipte de, sahibin `readEffective` kuralı (ve PREVENT'i) efektif kolonların dönem okumalarına satır bazında uygulanmalı. Uygulanmayacaksa, sahipte bir `readEffective` kuralı yazıldığında "this rule does not reach the effective columns of a versioned owner; write it on the managed tables" uyarısı verilmeli. Şu an kural kabul ediliyor ama hiçbir şey yapmıyor; bu tehlikeli.

## Yalnızca rol kapsamlı hücre `read` permit'leri, diğer çağıranlar için hücreyi açık bırakıyor
- **Görev:** `terminationReason`/`Type`/`Note` hücrelerini yalnızca hr_admin ve ofis HR manager'ına göstermek.
- **Kategori:** Keşfedilebilirlik
- **İlk deneme:** `GRANT read ON hr.employees.terminationReason TO hr_admin` + `… TO hr_manager FILTER leads(currentOffice)`. "Profile" makalesi birthdate için "A role-scoped grant that reaches the cell makes it readable for the members of that role and for nobody else besides the person" diyor; rol grant'i ekleyince diğerlerinin göremeyeceğini bekledim.
- **Sonuç:** Sıradan bir çalışan (can.dev), işten ayrılan bir meslektaşının `terminationReason` değerini okuyabildi. Birthdate örneğinde bunu kapatan şey, sistemin önceden tanımlı rolsüz self grant'i; kendi kolonumda böyle bir grant yok. Kural metninde ("a null-role permit … limits every caller to its expression on one open with no permit (cell read …)") cell read'in "permit yoksa açık" olduğu yazıyor, ama bu sonuç örneklerden çıkarılamıyor.
- **Sonraki denemeler:** `PREVENT read ON hr.employees.terminationReason EXCEPT hr_admin FILTER NOT leads(currentOffice)`.
- **Çözüm / Workaround:** Hassas hücreler için PREVENT ya da rolsüz bir `GRANT read … TO ALL FILTER false`.
- **Durum:** Workaround ile çözüldü
- **Öneri:** Cheat sheet "Access" sayfasına "a cell readable only by a role" tarifi eklenmeli (PREVENT EXCEPT ya da rolsüz `FILTER false` ile). Ayrıca rol kapsamlı bir cell read permit yazıldığında "this does not close the cell for other callers" uyarısı çok faydalı olur. Bu, PRD'deki "zero unauthorized salary/termination access" gibi gereksinimlerde kolayca gözden kaçan bir sızıntı.

## Platform designer, tenant base'te kullanıcıya bağlı `auth.*` sorgularını kullanamıyor
- **Görev:** Seed ve test sırasında `auth.sendPasswordReset`, `auth.deactivateUser` çağırmak.
- **Kategori:** Keşfedilebilirlik
- **İlk deneme:** Platform designer (MCP oturumu) olarak `auth.sendPasswordReset { userId }` ve `auth.deactivateUser { userId }`. `run_wql` açıklaması "a platform user … runs without access rules on a mutable base" dediği için çalışmasını bekledim.
- **Sonuç:** `sendPasswordReset` → 404 "no primary email address the caller may read"; `deactivateUser` → `rowCount: 0`, hatasız ama etkisiz. hr_admin olarak (`targetUserId`) da etkisiz, çünkü tenant rollerine `auth.users` update izni verilmemiş.
- **Sonraki denemeler:** Gövdeleri okudum (`system.models.body`); ikisi de policied sorgular.
- **Çözüm / Workaround:** Aynı gövdeli elevated HR sorguları: `hr.sendSetPasswordLink`, `hr.setAccountActive` (call grant: hr_admin, hr_manager; ofis kapsamı ASSERT ile).
- **Durum:** Workaround ile çözüldü
- **Öneri:** Bu sorgular platform designer için de çalışmalı (ya da "this named query runs policied; the platform designer is not a user of this base" diye açık hata vermeli). `deactivateUser`'ın sessizce 0 satır dönmesi, yönetici ekranında "deaktive edildi" sanılmasına yol açabilir.

---

## Versiyonlu UPDATE, aynı tabloyu okuyan adlandırılmış sonucu değer olarak kullanınca sessizce NULL yazıyor
- **Görev:** Seed sonrası her çalışan için yansıtma kolonlarını (`currentManager`, `currentOffice`, `approver`) `hr.refreshMirrors` ile doldurmak.
- **Kategori:** Bug (sessiz veri kaybı)
- **İlk deneme:** `$now := SELECT hr.employees { m := manager._id, o := office._id } FILTER _id == $id TAKE 1; UPDATE hr.employees [_id == $id] { currentManager: $now.m, currentOffice: $now.o }`. Motorun "read it with a SELECT and bind the value it returns" yönlendirmesine birebir uydum.
- **Sonuç:** Her çağrı `rowCount: 1` ve `_id` döndürdü, hata yok. Ama 16 çalışanın hepsinde üç kolon da NULL kaldı. `hr.changeJob` içindeki aynı desen de `approver`'ı NULL bırakmıştı.
- **Sonraki denemeler:** Aynı iki statement'ı `UPDATE HARD` ile çalıştırdım → değerler doğru yazıldı. Açıklama: versiyonlu UPDATE önce mevcut versiyonu kapatıyor (`_endAt`), `$now` aynı statement içinde yeniden hesaplanıyor (bkz. "Adlandırılmış sonuçlar her statement'ta yeniden hesaplanıyor") ve artık açık satır bulamayıp NULL dönüyor.
- **Çözüm / Workaround:** Türetilmiş/yansıtma kolonları `UPDATE HARD` ile yazmak. Yan etki: `UPDATE HARD [_id == x]` satırın kapalı versiyonlarını da güncelliyor (rowCount 2–6); tarihçeye ihtiyaç duyulmayan yansıtma kolonları için kabul edilebilir.
- **Durum:** Workaround ile çözüldü
- **Öneri:** Versiyonlu UPDATE'te değer ifadeleri, versiyon kapatılmadan **önceki** snapshot'tan hesaplanmalı (ya da adlandırılmış sonuçlar statement başında materialize edilmeli). En azından "a value reads a named result over the table this versioned UPDATE writes" durumunda derleme hatası verilmeli. Ayrıca `UPDATE HARD`'ın kapalı versiyonlara da dokunduğu dokümana yazılmalı.

## E-posta sağlayıcı satırı eklemek onu varsayılan yapmıyor; mail gönderimleri sessizce düşüyor
- **Görev:** Seed çalışanlarına set-password maili göndermek (kullanıcı onaylı, 15 mail).
- **Kategori:** Keşfedilebilirlik (+ sessiz başarısızlık)
- **İlk deneme:** Task 1'de `INSERT system.email_providers { slug: 'default', … config: { providerType: 'smtp', host: 'SMTP_HOST', … } }` ile sağlayıcı ekledim; doğrulamada yalnızca satırın var olduğunu kontrol ettim. "Base environment" makalesi "pass their names to `system.insertEmailProvider`" dediği için doğrudan INSERT'in eşdeğer olacağını bekledim.
- **Sonuç:** `hr.hireEmployee` (gövdesi `auth.createAccount` ile aynı `job.sendEmail` çağrısı) 15 hesabı oluşturdu ama hiçbir mail gitmedi; hata ya da uyarı yok (`job.sendEmail`'in `queued:false` dönüşü kontrol edilmeden yutuluyor, bu `auth.createAccount`'un da tasarımı). Kuyruk boştu.
- **Sonraki denemeler:** Geçici bir named query ile `job.sendEmail` sonucunu döndürdüm: `{ queued: false, reason: 'not-configured', message: 'this base has no mail provider configured' }`. `system.email_settings` tablosunu buldum: `defaultProvider` NULL'dı (ana base'te dolu). `UPDATE system.email_settings [true] { defaultProvider: <provider _id> }` sonrası `queued: true`.
- **Ek sorun:** Mailleri yeniden göndermek için `auth.sendPasswordReset { userId }` 404 "The account has no primary email address the caller may read" döndü. Sorgu policied ve platform designer tenant base'te kullanıcı olmadığı için adresi "okuyamıyor". Aynı gövdeyle elevated bir `hr.sendSetPasswordLink` yazdım (HR'ın "daveti yeniden gönder" işlemi olarak da kullanılıyor).
- **Çözüm / Workaround:** `system.email_settings.defaultProvider`'ı ayarlamak + elevated yeniden gönderim sorgusu.
- **Durum:** Workaround ile çözüldü
- **Öneri:** (1) `email_providers`'a ilk satır eklendiğinde `defaultProvider` boşsa otomatik ayarlansın, ya da en azından `update_flow`'un yaptığı gibi bir uyarı versin. (2) Makaleye `system.email_settings.defaultProvider` yazılmalı. (3) `auth.createAccount`, mail kuyruğa girmezse sonuçta `mailQueued: false` döndürmeli; tamamen sessiz kalmamalı. (4) `auth.sendPasswordReset`'in platform designer'a 404 dönmesi yanıltıcı; designer için çalışmalı ya da hata nedeni ("caller is not a user of this base") açıkça yazmalı.

---

## Erişim kuralları efektif kolonları okuyamıyor; satır kapsamı için yansıtma kolonu gerekiyor
- **Görev:** HR manager'ın yalnızca kendi ofisindeki çalışanların iş geçmişini (efektif dönemlerini) görmesi: `GRANT readEffective ON hr.employees TO hr_manager FILTER leads(office)` (`office` efektif bir team kolonu).
- **Kategori:** Eksik özellik
- **İlk deneme:** Kuralı doğrudan efektif `office` kolonu üzerine yazdım. "Built-in teams" makalesi `leads(team)`'i bir team kolonu üzerinde gösteriyor; kural "bugün" değerlendirildiği için efektif kolonun bugünkü değerini okuyacağını bekledim.
- **Sonuç:** Net bir hata aldım: "This rule on hr.employees.readEffective reads "office", an effective column … the rule would depend on itself (a cycle). Read another column, or leave the effective column out of the rule; a rule on update or insert may read it." Toplu gönderimin tamamı geri alındı.
- **Sonraki denemeler:** Rev 2 tasarımında yansıtma kolonlarını kaldırmıştım; tekrar eklemek zorunda kaldım.
- **Çözüm / Workaround:** Düz `currentOffice` (team) ve `currentManager` (user) kolonları ekledim. Bunları değişikliği yapan elevated named query'ler ve gece senkronu güncelliyor; tüm kapsam kuralları bu kolonları okuyor.
- **Durum:** Workaround ile çözüldü
- **Öneri:** Kuralın, efektif kolonun **bugünkü** değerini okuyabilmesi için motor içi bir yol olmalı (örneğin managed table'ın erişimini sahibin `read` kuralından değil sabit bir sistem kuralından türetmek). Bu olmayacaksa "Effective-dated tables" ve "Built-in teams" makalelerine "efektif kolona göre satır kapsamı → düz bir yansıtma kolonu tut" tarifi eklenmeli; şu an bu, tasarım bittikten sonra hata mesajıyla öğreniliyor.

---

## Opsiyonel named query parametreleri: tip çıkarımı tutarsız, hata mesajları konumsal
- **Görev:** `hr.hireEmployee` ve `hr.changeJob` named query'lerini opsiyonel alanlarla (çağıranın göndermediği alanlar) yazmak.
- **Kategori:** Bug
- **İlk deneme:** Parametreleri ilk kullanımda `$x(type: uuid)` ile tipleyip, alan başına `UPDATE EFFECTIVE FROM … [_id == $id AND $x IS NOT NULL] { col: $x }` koruması kullandım. "ASSERT and LOCK" makalesindeki `$key(type: string, required)` örneğinden, tip bildiriminin parametrenin tamamına uygulanacağını ve `required` yazılmayanların opsiyonel olacağını bekledim.
- **Sonuç:** Üç ayrı, belirsiz hata aldım: (1) `inconsistent types deduced for parameter $3` (hangi WQL parametresi olduğu söylenmiyor; dry-run çıktısı 150 KB'tı, `jq` ile `familyName`/`hireDate` olduğunu buldum). (2) `Query requires the parameters "departmentTeamId", "officeTeamId"`: NOT NULL efektif kolona yazılan parametre, `IS NOT NULL` korumalı UPDATE'te bile zorunlu sayılıyor. (3) `could not determine data type of parameter $2`: tip bildirimi yalnızca yazıldığı yerde geçerli, aynı parametrenin diğer kullanımları tipsiz kalıyor.
- **Sonraki denemeler:** Her kullanımda `::uuid` / `::text` cast'i ekledim; NOT NULL kolona yazımı `coalesce($x::uuid, $cur.x)` ile sardım; ad birleştirmede `concat($a::text, ' ', $b::text)` kullandım.
- **Çözüm / Workaround:** Opsiyonel bir parametrenin her kullanımında açık cast + NOT NULL kolonlarda `coalesce(param, mevcut değer)`.
- **Durum:** Workaround ile çözüldü
- **Öneri:** `$x(type: T)` bildirimi parametrenin tüm kullanımlarına yayılmalı. Bir korumanın (`[$x IS NOT NULL]`) içindeki yazma, zorunluluk çıkarımında "koşullu" sayılmalı. PG hataları (`parameter $3`) WQL parametre adına çevrilip gösterilmeli.

## Adlandırılmış sonuçlar her statement'ta yeniden hesaplanıyor (anlık görüntü değil)
- **Görev:** `hr.changeJob` içinde değişiklik öncesi değerleri (`$cur`) okuyup, alanları güncelledikten sonra eski team üyeliklerini kapatmak.
- **Kategori:** Keşfedilebilirlik
- **İlk deneme:** `$cur := SELECT EFFECTIVE $d hr.employees {...}` ilk statement; ardından alan UPDATE'leri; en sonda `$cur.pt`'ye göre `DELETE/INSERT auth.team_memberships`. Cheat sheet "`$x := ...;` = SQL `WITH`" dediği için `$cur`'un bir kez okunup sabit kalacağını bekledim.
- **Sonuç:** Hata yok ama yanlış sonuç: ürün ekibi üyeliği taşınmadı. Dry-run parametre haritası, `$cur`/`$head`'in her sonraki statement'a CTE olarak gömüldüğünü gösterdi. UPDATE'lerden sonra `$cur.pt` zaten yeni değeri okuyor, koşul yanlış oluyor. Bir başka yan etki: `$p := SELECT EFFECTIVE ALL …`'ı okuyan sonraki statement, `EFFECTIVE ALL` anını da devralıp "EFFECTIVE ALL cannot read office" hatası verdi.
- **Sonraki denemeler:** `auth.createAccount` gövdesindeki yorumda ("a result a statement writes can be read by one later statement only") kısıtın tasarlanmış olduğuna dair bir ipucu buldum.
- **Çözüm / Workaround:** Önceki değere dayanan yazmaları, o değeri değiştiren yazmalardan **önce** sıralamak. `EFFECTIVE ALL` okuyan adlandırılmış sonucu, başka bir okumanın girdisi yapmamak.
- **Durum:** Workaround ile çözüldü
- **Öneri:** Cheat sheet ve "Composing" sayfasına net bir kural yazılmalı: "a named result is re-evaluated in each statement that reads it; it is not a snapshot" + sıralama örneği. İsteğe bağlı bir `MATERIALIZE $x := …` ya da `$x := SNAPSHOT …` formu çok faydalı olur.

## Efektif kolonların managed tablolarına ek kolon (reason) toplu eklenemiyor
- **Görev:** `hr.employees`'in 14 efektif kolonunun her birinin dönemine bir `reason` (değişiklik nedeni) eklemek.
- **Kategori:** Eksik özellik
- **İlk deneme:** `design_table` kolon metadata'sında managed table için ek kolon tanımlamanın bir yolunu aradım (`describe_column_type` → `effective` açıklaması); yok. Makale "add the managed columns you want to record (`reason`) with `add_column` on the managed table" diyor.
- **Sonuç:** 14 + 3 (org.units) ayrı `add_column` çağrısı gerekti; her biri managed table id'siyle.
- **Sonraki denemeler:** —
- **Çözüm / Workaround:** `design_table` yanıtındaki `managedTables` listesindeki her id için `add_column { name: 'reason' }`.
- **Durum:** Workaround ile çözüldü
- **Öneri:** Efektif kolon metadata'sına `managedColumns: [{ name, metadata }]` (ya da tablo seviyesinde "tüm efektif kolonlara şu kolonları ekle") eklenmeli; `reason` o kadar yaygın ki varsayılan olarak bile gelebilir.

---

## Tablosuz SELECT'te çok satırlı adlandırılmış sonuç opak hata veriyor
- **Görev:** İki doğrulama sorgusunu (e-posta sağlayıcıları, roller) tek gönderimde birleştirip tek satırda döndürmek.
- **Kategori:** Bug
- **İlk deneme:** `$p := SELECT system.email_providers {...}; $r := SELECT auth.roles {...}; SELECT { providers := $p, roles := $r }`. Cheat sheet "`$x := ...;` = SQL `WITH`" diyor; "Calling a function from WQL" makalesi de "a table-less `SELECT` read it" diyor. Adlandırılmış sonuçların tablosuz SELECT'te dizi olarak okunabileceğini bekledim.
- **Sonuç:** `Statement 3: The database could not run this statement.` (INVALID_REQUEST). Ne yanlış olduğu belirtilmiyor. Aynı hatayı daha önce spike'ta (`SELECT { a := $a, b := $b }`) da almıştım; iki ayrı sorguda tekrarlandı.
- **Sonraki denemeler:** Bilgi tabanında tablosuz SELECT'te çok satırlı adlandırılmış sonucun nasıl okunacağını aradım (`system.searchArticles`), bulamadım.
- **Çözüm / Workaround:** Sorguları ayrı çağrılarla çalıştırmak (ya da sonucu `TAKE 1` ile tek satıra indirip `$x.col` okumak).
- **Durum:** Workaround ile çözüldü
- **Öneri:** Ya desteklenmeli (çok satırlı sonuç `jsonb_agg` ile dizi olarak projekte edilebilir) ya da derleyici "`$p` holds several rows; a table-less SELECT reads one row: use `$p[...]` / `TAKE 1`" gibi bir hata vermeli. Genel "could not run this statement" mesajı tasarım yetkili çağırana ham PG hatasını göstermeli.

---

## Versiyonlu tabloda UPDATE değerindeki reverse-link aggregate geçersiz SQL üretiyor
- **Görev:** Bitemporal `job` tablosuna yazılınca, çalışanın güncel ünvanını versiyonlu `emp` tablosundaki düz bir kolona (`curTitle`) yansıtmak.
- **Kategori:** Bug
- **İlk deneme:** `add_trigger` ile `spike.job` üzerinde `UPDATE spike.emp [jobs HAS (_id == ANY($ids::uuid[]))] { curTitle: jobs[max(title)] }`. Cheat sheet "`lines[count(*)]` = satır başına toplam" dediği için reverse link üzerinden aggregate'in değer olarak yazılabileceğini bekledim.
- **Sonuç:** Trigger kaydedildi, ama ilk INSERT'te: `custom trigger "sync_cur_title" on spike.job: invalid reference to FROM-clause entry for table "emp"`.
- **Sonraki denemeler:** Aynı ifadeyi trigger dışında `run_wql` ile çalıştırdım (`UPDATE spike.emp [code == 'E1'] { curTitle: jobs[max(title)] }`). Genel bir "The database could not run this statement." hatası aldım. `run_wql_dry` ile baktığımda versiyonlu UPDATE'in yeni versiyonu `INSERT ... SELECT ... FROM emp current` ile yazdığını, aggregate alt sorgusunun ise `current` alias'ı yerine tam tablo adıyla (`"…emp_"."_id"`) korelasyon kurduğunu gördüm. Bu geçersiz bir SQL.
- **Çözüm / Workaround:** Değeri önce bir SELECT ile okuyup parametre olarak bağlamak: `$e := SELECT ... TAKE 1; UPDATE ... [_id == $e._id] { col: $e.x }`. Tasarımda bu senkronu tamamen kaldırıp değişen iş alanlarını efektif kolonlara taşıdım (bkz. plan).
- **Durum:** Workaround ile çözüldü
- **Öneri:** Versiyonlu UPDATE'in INSERT…SELECT dalında, link/aggregate alt sorgularının korelasyonu `current` alias'ına yeniden yazılmalı. Ayrıca istemciye giden "The database could not run this statement." mesajı ham PostgreSQL hatasını (en azından tasarım yetkisi olan çağırana) göstermeli; trigger içinden aynı hata detaylı geliyor, doğrudan çağrıda gelmiyor.

## Stored function'lar MCP üzerinden yazılamıyor
- **Görev:** PTO tahakkuk hesabını (planlanan tasarımda) bir stored function'a koymak.
- **Kategori:** Eksik özellik
- **İlk deneme:** Tool listesinde `create_function` benzeri bir tool aradım; yoktu. `system.getArticle { slug: "foundations-stored-functions" }` okudum.
- **Sonuç:** Makale açıkça "The MCP server has no tool that writes or calls a function over HTTP … WQL writes to `system.models` are unsupported" diyor. Function yalnızca `POST /api/<baseId>/models` HTTP route'uyla, tasarım yetkili bir token'la yazılabiliyor. MCP oturumunun token'ı agent'a verilmiyor (ve verilmemeli).
- **Sonraki denemeler:** —
- **Çözüm / Workaround:** "Choosing the door" kuralı gereği function'a ancak hiçbir sorgu hesaplayamıyorsa gerek var. Tahakkuk aritmetiğini named query + flow `wql` adımına taşıdım; function kullanmıyorum.
- **Durum:** Workaround ile çözüldü
- **Öneri:** `create_function` / `update_function` / `test_function` MCP tool'ları (trigger tool'ları gibi) eklenmeli; ya da CLI'a `wyndbase function push` komutu konup makalede o yol gösterilmeli.

## `system.answerInteraction` adı ve `response` biçimi keşfedilemiyor
- **Görev:** Bir interaction isteğini test için onaylayan kullanıcı adına (`targetUserId`) cevaplamak.
- **Kategori:** Keşfedilebilirlik
- **İlk deneme:** `system.searchArticles { term: "answerInteraction interactionId response named query" }`. "Interaction" makalesi `answerInteraction`'dan söz ediyor ama tam adını ve parametrelerini vermiyor; aramada da başka bir yer çıkmadı.
- **Sonuç:** Adı `system.answerInteraction` diye tahmin edip `run_wql_dry` ile doğruladım. `parameterMeta` `response`'u `type: "text"` olarak gösteriyor. JSON metni (`"{\"decision\":\"approve\"}"`) gönderince "The response does not match the request's form" (400) hatası aldım.
- **Sonraki denemeler:** `response`'u JSON nesnesi olarak (`{ "decision": "approve" }`) gönderdim; çalıştı ve flow devam etti.
- **Çözüm / Workaround:** `system.answerInteraction { interactionId, response: <object> }`.
- **Durum:** Çözüldü (zorlanarak)
- **Öneri:** Interaction makalesine "Answering through MCP / WQL" bölümü: tam ad, parametreler ve örnek. `response` parametresinin meta tipi `text` yerine `json`/`object` olmalı; ya da metin olarak gelen JSON parse edilmeli.

---

## drop_space başka space'teki reverse link kolonlarını yetim bırakıyor
- **Görev:** Doğrulama (spike) için açtığım `spike` space'ini ve içindeki tabloları temizlemek.
- **Kategori:** Bug
- **İlk deneme:** `drop_space { _id: <spike>, confirm: false }` ile önizleme. Önizleme yalnızca spike tablolarını listeledi; reverse kolonların da düşeceğini bekledim (`drop_link` açıklaması "also drops its reverse columns" diyor). Ardından `confirm: true`.
- **Sonuç:** Space ve tablolar silindi, fakat `auth.teams` üzerindeki reverse kolonlar `spikeMeta` (one-to-one) ve `spikeMetas` (many-to-one reverse) kaldı. `system.listColumnsInTable { table: "auth.teams" }` hâlâ ikisini gösteriyordu; ikisi de artık var olmayan tablo id'lerine işaret ediyor. Dry-run önizlemesi bu kolonlardan hiç bahsetmedi.
- **Sonraki denemeler:** `drop_link { _id, confirm: false }` önizlemesi kolonu ve silinmiş hedef tabloyu gösterdi; `confirm: true` ile ikisini de kaldırdım.
- **Çözüm / Workaround:** Bir space ya da tablo silmeden önce, o tablolara bağlı link'leri `drop_link` ile kaldırmak (ya da sonradan `system.listColumnsInTable` ile hedef tabloyu kontrol edip yetimleri temizlemek).
- **Durum:** Workaround ile çözüldü
- **Öneri:** `drop_space` / `drop_table`, silinen tablolara işaret eden diğer tablolardaki link ve reverse kolonları da düşürmeli ve dry-run önizlemesinde "affectedColumns" olarak listelemeli. Bir system tablosunda (`auth.teams`) yetim model kolonu kalması özellikle riskli.

---

## one-to-one link'in iki ucu senkron tutulmuyor (reverse okuma null dönüyor)
- **Görev:** Yerleşik bir team'e (`auth.teams`) metadata (tür, masraf merkezi) eklemek için ayrı bir tabloyu 1:1 link'le bağlamak ve team tarafından okumak.
- **Kategori:** Bug
- **İlk deneme:** `setup_link { fromTableId: "spike.team_meta", toTableId: "auth.teams", name: "team", cardinality: "one-to-one", reverseName: "spikeMeta", onDelete: "cascade" }`. Ardından `INSERT spike.team_meta { team: <teamId>, ... }` ve `SELECT auth.teams { name, kind := spikeMeta.kind }`. Tool açıklaması "Create a link column AND its reverse-navigation mirror" dediği için team tarafından okumanın çalışmasını bekledim.
- **Sonuç:** İleri yön (`team_meta.team.name`) doğru; reverse (`auth.teams.spikeMeta.kind`) her satırda `null`. `run_wql_dry`, reverse okumanın `auth.teams` üzerindeki fiziksel `_backref_spikeMeta_` kolonuna join yaptığını gösterdi. İleri taraftan yazmak bu kolonu doldurmuyor.
- **Sonraki denemeler:**
  - `auth.teams`'e özgü mü diye iki kullanıcı tablosuyla (`spike.o2o_meta` → `spike.o2o_target`, one-to-one, reverse `meta`) denedim; aynı sonuç çıktı.
  - Reverse taraftan yazdım (`INSERT o2o_target { meta: $m._id }`): bu kez reverse okunuyor ama ileri yön (`o2o_meta.target.name`) `null`. İki uç bağımsız iki kolon; hangisine yazarsan yalnızca o yön görünüyor.
  - Yan gözlem: `$a := SELECT ...; $b := SELECT ...; SELECT { a := $a, b := $b }` genel bir "Statement 3: The database could not run this statement." hatası verdi; ne yanlış olduğu belirtilmiyor.
- **Çözüm / Workaround:** one-to-one yerine **many-to-one + `team` kolonunda `unique` constraint + `reverseName`**. Reverse okuma join ile hesaplanıyor ve çalışıyor (`auth.teams { m := spikeMetas[array_agg(note)] }` → `["eng-meta"]`); ikinci metadata satırı "This team is already in use." ile reddediliyor. Bedeli: reverse tek satır yerine dizi olarak okunuyor.
- **Durum:** Workaround ile çözüldü
- **Öneri:** one-to-one'da tek bir saklama kolonu olmalı ve reverse uç ondan join ile hesaplanmalı ya da iki kolon tek yazmada birlikte güncellenmeli. Aksi halde setup_link açıklaması "mirror" dememeli.

## Team'e metadata eklemek ve çok köklü team ormanı keşfedilemedi
- **Görev:** Departmanlar, ürün ekipleri ve ofisler için yerleşik team ağacını kullanıp kullanamayacağıma karar vermek; her birime ek alan (masraf merkezi, tür, başkan) eklemek.
- **Kategori:** Keşfedilebilirlik
- **İlk deneme:** `dcl-built-in-teams` makalesini okudum. "Teams are one tree with a single parent" ve "What teams do not cover… keep the relationship in your own tables" cümlelerinden departman/ürün ekibi/ofis hiyerarşilerinin aynı ağaca sığmayacağı sonucunu çıkardım ve kullanıcıya bunu söyledim. `auth.teams`'in kolonları sabit (`name`, `parent`, `leadScope`…); metadata eklemenin yolu makalede geçmiyor.
- **Sonuç:** Kullanıcı (1) kökte birden fazla team olabileceğini (orman) ve (2) team metadata'sının ayrı tablo + 1:1 link ile kurulduğunu söyledi. Doğruladım: `INSERT auth.teams { name }` ile iki kök ve altlarına çocuklar sorunsuz açıldı.
- **Sonraki denemeler:** 1:1 link'i denedim (yukarıdaki bug); many-to-one + unique ile çözdüm.
- **Çözüm / Workaround:** Departmanlar, ürün ekipleri ve ofisler aynı `auth.teams` ormanında üç ayrı kök altında tutulabilir. Metadata kendi tablomuzda, team'e unique many-to-one link'le bağlanır.
- **Durum:** Workaround ile çözüldü
- **Öneri:** `dcl-built-in-teams` makalesine (a) "a base may hold several root teams: e.g. one tree for departments and one for offices; a person can be a member in each" cümlesi, (b) "Attaching your own columns to a team" başlıklı bir tarif (tablo + `team` link'i + unique) eklenmeli. "one tree" ifadesi "one parent per team" olarak düzeltilmeli; şu an tek kök gibi okunuyor.

---

## Adlandırılmış yazma sonucundan sonraki SELECT yeni satırları görmüyor
- **Görev:** Birden fazla kök team (departmanlar, ofisler) ve altlarına çocuk team'ler açıp aynı gönderimde sonucu okumak.
- **Kategori:** Bug
- **İlk deneme:** Tek `run_wql` gönderimi:
  `$r1 := INSERT auth.teams {...} -> { _id }; ... $c1 := INSERT auth.teams { ..., parent: $r1._id } -> { _id }; ...; SELECT auth.teams { _id, name, p := parent.name } FILTER name LIKE 'spike_%'`. Cheat sheet "`$x := ...;` = SQL `WITH`" ve "`->` yazılanı geri okur" diyor; ardışık ifadelerin sırayla çalışıp son SELECT'in yazılanları göreceğini bekledim.
- **Sonuç:** `{"isMutation":true,"result":[],"rowCount":0}`. Hata ya da uyarı yok. Satırlar aslında yazılmıştı; ayrı bir SELECT dört satırı da gösterdi.
- **Sonraki denemeler:** Farkı izole ettim:
  - `INSERT auth.teams {...}; SELECT ...` → görüyor.
  - `INSERT spike.plain_t {...}; SELECT ...` → görüyor.
  - `$a := INSERT spike.plain_t { label: 'rw7' } -> { _id }; SELECT spike.plain_t { label } FILTER label == 'rw7'` → **boş**. Sorun team'lere özgü değil; düz kullanıcı tablosunda da oluyor.
  - `run_wql_dry` ile derlenen SQL: iki ifade tek bir `WITH "a" AS (INSERT ... RETURNING "_id") SELECT ... FROM plain_t` olarak birleşiyor. PostgreSQL'de data-modifying CTE'nin yazdığı satırlar aynı ifadenin ana sorgusunda görünmez. Yalın `INSERT` ayrı bir ifade olarak derlendiği için görünüyor.
- **Çözüm / Workaround:** Bir yazmadan sonra aynı tabloyu okumak gerekiyorsa (1) yazmayı adlandırmayın (yalın `INSERT ...;`) ya da (2) okunacak değerleri `-> { ... }` ile yazmanın kendisinden döndürüp `$x` üzerinden okuyun ya da (3) okumayı ayrı bir çağrıda yapın.
- **Durum:** Workaround ile çözüldü
- **Öneri:** Davranış en azından tutarlı olmalı: adlandırılmış yazmadan sonraki ifade ayrı bir SQL ifadesi olarak çalışsın ya da derleyici "this read cannot see rows written by `$a` in the same statement" diye uyarı versin. Aynı metnin `$a :=` eklenince sessizce farklı sonuç vermesi tehlikeli (named query'lerde insert-then-select kalıbı çok yaygın). Cheat sheet'teki "`$x := ...` = `WITH`" satırının yanına bu görünürlük sınırı yazılmalı.

---

## "Audit trail" makalesi change_log kapsamını yanlış anlatıyor
- **Görev:** PRD'nin "tüm CRUD aksiyonları before/after ile loglanmalı" gereksinimi için hangi tabloların `system.change_log`'a yazıldığını öğrenmek.
- **Kategori:** Keşfedilebilirlik (dokümantasyon hatası; davranış doğru, makale yanlış)
- **İlk deneme:** `system.searchArticles { term: "audit log changes actor before after values row history" }` → `foundations-audit-trail` makalesini okudum. Makale açıkça "only a table with period machinery (effective-dated, or with an effective owner) is logged; a plain table is not" diyor (Semantics 2, `X-14513`). Buna güvenip ilk tasarım taslağına "audit için PTO/politika tablolarını da efektif yapmam gerekecek" diye yazdım ve kullanıcıya bunu bildirdim.
- **Sonuç:** Kullanıcı bilginin hatalı olduğunu söyledi. Ben de doğruladım: `wynpeople` üzerinde `spike.plain_t` (versiyonsuz, efektif değil) ve `spike.versioned_t` (`hasVersion`) tablolarına INSERT + UPDATE yaptım. `SELECT system.change_log {...} FILTER row IN [...]` beş kayıt döndürdü: düz tablo için INSERT ve UPDATE (oldValues/newValues dolu), versiyonlu tablo için INSERT, eski versiyonu kapatan UPDATE ve yeni versiyonun INSERT'i. Yani düz tablolar da loglanıyor.
- **Sonraki denemeler:** —
- **Çözüm / Workaround:** Gerek yok. Tasarımda audit için tabloları efektif yapmaya zorlamayacağım.
- **Durum:** Çözüldü (dokümantasyon hatası)
- **Öneri:** `foundations-audit-trail` makalesinin Summary, "Not every table is logged" ve Semantics 2 bölümleri düzeltilmeli: her model tablosunun loglandığı yazılmalı. Versiyonlu bir tabloda tek bir UPDATE'in üç kayıt ürettiği (eski versiyonu kapatan UPDATE + yeni versiyonun INSERT'i) da örnekle açıklanmalı; aksi halde "row'un değişikliklerini listele" sorgusu kafa karıştırıcı sonuç verir.

---

## SMTP e-posta sağlayıcısı kurulumunun parametreleri dokümante değil
- **Görev:** wynpeople base'ine SMTP sağlayıcısı tanımlamak için gereken çağrıyı planlama aşamasında doğrulamak (HOST/PORT/SECURE/FROM_EMAIL).
- **Kategori:** Keşfedilebilirlik
- **İlk deneme:** `system.searchArticles { term: "insertEmailProvider smtp host port secure fromEmail" }`. "Base environment" makalesi `system.insertEmailProvider` adını verdiği için parametrelerin ya o makalede ya da "Send email" makalesinde olmasını bekledim.
- **Sonuç:** Makaleler sadece "anahtarları oluştur, isimlerini `system.insertEmailProvider`'a ver" diyor. SMTP için hangi alanların (`host`, `port`, `secure`, `username`) beklendiği, `host`'un düz değer değil **env key adı** olduğu, `fromEmail`'in nerede verildiği hiçbir yerde yazmıyor. `system.searchArticles { term: "email provider" }` de aynı makaleleri döndürdü.
- **Sonraki denemeler:** `system.listNamedQueries { search }` denedim; parametre almıyor (hata: "accepts no parameters"). Ardından `system.listTablesInSpace { space: "system" }` → `system.listColumnsInTable { table: "system.email_providers" }` ile `config` kolonunun JSON Schema'sını okudum: smtp varyantı `{ providerType: "smtp", host: <ENV_KEY_ADI>, port: number, secure?: boolean, username?: <ENV_KEY_ADI> }`. Ana base'deki mevcut satır (`host: "SMTP_HOST"`) bunu doğruladı.
- **Çözüm / Workaround:** Şema sistem tablosunun kolon metadata'sından okundu. Uygulamada: `system.createEnvKey { key: "SMTP_HOST", value: "192.168.1.31" }`, ardından provider satırı (`fromEmail`, `config`).
- **Durum:** Çözüldü (zorlanarak)
- **Öneri:** "Base environment → Provider settings" bölümüne (ya da ayrı bir "Email providers" makalesine) sağlayıcı tipi başına `config` şemasını ve bir SMTP örneğini (`system.createEnvKey` + `system.insertEmailProvider` çağrısı birlikte) ekleyin. `host` alanının değer değil env key adı olduğu açıkça yazılmalı; pattern hatası (`^[A-Za-z_]…`) IP adresi girildiğinde kafa karıştırır. `system.listNamedQueries`'e bir isim filtresi eklemek de NQ parametre şemasını bulmayı kolaylaştırır.

---

## Dosya kolonuna yükleme: yetki eksikliği "ColumnNotFoundError" olarak dönüyor
- **Görev:** Madde 8: çalışan belgeleri. `hr.employees.documents` dosya kolonuna SDK `storage.attach` ile dosya yüklemek.
- **Kategori:** Bug (yanıltıcı hata). Ayrıca keşfedilebilirlik.
- **İlk deneme:** `wyndbase.storage.attach(file, { column: 'hr.employees.documents', record: employeeId })` (tipteki yorum: "A file column, by `_id` or canonical dotted path"). Lena (hr_manager, Berlin) oturumu, Berlin'deki çalışan.
- **Sonuç:** `404 ColumnNotFoundError: The column named by columnId does not exist. It may already be deleted.` Hiçbir şey yüklenmedi.
- **Sonraki denemeler:**
  - Kolonun `_id`'si (`system.listColumnsInTable` ile doğrulandı) ile denedim: aynı 404.
  - `auth.users.picture` kolonu `recordId` verilmeden: aynı 404. `recordId` olarak kendi kullanıcı id'mle: **çalıştı** (attachmentId + presignedUrl döndü). Avatar yükleme bu yolla yapıldı.
  - "Profile pictures" makalesi (`storage-pictures`) yüklemenin tablonun `update` kuralını izlediğini söylüyor. `GRANT update ON hr.employees.documents TO hr_manager FILTER leads(currentOffice)` (kolon düzeyi) ekledim: yine 404. Kural geri alındı.
  - Kullanıcı onayıyla tablo düzeyi `GRANT update ON hr.employees TO hr_manager/hr_admin FILTER leads(currentOffice)` verildi: yükleme çalıştı, dosya açıldı (200). Başka ofisteki çalışana yükleme yine 404 döndü (kapsam korunuyor, ama yine yanlış hata koduyla).
- **Çözüm / Workaround:** Tablo düzeyi update yetkisi ve buna ek olarak `PREVENT update ON hr.employees TO ALL FILTER self(person)`. Yan etki: İK artık yönettiği ofisin çalışan satırlarına named query'nin ASSERT'lerini (gerekçe zorunluluğu vb.) atlayarak doğrudan yazabilir. Kendi satırını yazamaz; bu doğrulandı: önce Lena kendi `costCenter`'ını değiştirebildi, geri alındı, PREVENT sonrası 0 satır.
- **Durum:** Workaround ile çözüldü (yetki genişletilerek)
- **Öneri:** Yetki eksikliği 403 olarak dönmeli ve gereken izni söylemeli (ör. "uploading into hr.employees.documents needs update on hr.employees for this row"). 404 + "column may already be deleted" mesajı saatlerce yanlış iz sürdürüyor. Ayrıca yüklemenin yalnızca elevated bir named query'den geçen yazma akışlarıyla da kullanılabilmesi için bir yol gerekli. Örneğin kolon düzeyi `update` yetkisinin yeterli sayılması ya da `attach`'in bir named query'nin yetkisiyle çağrılabilmesi.

---
