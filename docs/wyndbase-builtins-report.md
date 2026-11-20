# Kaçırılan Wyndbase yerleşik özellikleri — wynpeople

Tarih: 2026-11-20. Kaynak: Wyndbase bilgi tabanı (`wyndbase` base'i) ve wynpeople modeli. Her madde makale adıyla verildi. Kritik iddialar (`sensitive` okuma kaydı, devredilebilir onay kuralı, "yürürlüğe girdiğinde tetiklenen akış") ayrıca elle doğrulandı.

**Genel ders:** Yazma sorgularının çoğunu `elevated` yaptık. Elevated sorgu, akış adımı ve servis çağrısı kuralların (GRANT/PREVENT, FSM geçiş yetkileri) dışında çalışır. Bu yüzden yerleşik **politika** özellikleri bizim yazıcılarımızı bağlamaz. Herkesi bağlayanlar **check constraint**, **kolon kuralları** ve efektif kolonun **geçiş kuralı**dır ("Nothing runs past it, an elevated named query … included" — `dcl-choosing-the-door`).

## Öncelik sırasıyla kaçırılan fırsatlar

| # | Elle yaptığımız | Yerleşik karşılığı | Makale | Kazanç | Efor |
|---|---|---|---|---|---|
| 1 | İK "override": yönetici yokken talebi İK onaylıyor | **Yetki devri** — `DELEGATE answer ON pto.requestApproval.ask … UNTIL …`. Onay kuralımız zaten `isDelegatable: true`, yalnızca arayüz eksik | `dcl-authority-delegation`, `workflows-interaction` | Yönetici izne çıkarken onayını birine devreder, İK'ya düşen iş azalır | Düşük (bir "vekil ata" ekranı) |
| 2 | Ayna kolonlar (`approver`, `currentManager`, `currentOffice`) gece işiyle tazeleniyor; ileri tarihli yönetici değişikliği bir gün gecikmeli | **Veri yürürlüğe girdiğinde tetiklenen akış** — efektif kolonda akış, dönem başladığı anda (o an yazma olmasa da) çalışır | `workflows` ("Flows on data that takes effect over time") | Gece işi kalkar; yönetici değişikliği o gün geçerli olur (review'daki açık kalan madde kapanır) | Orta |
| 3 | Doğrulamalar ASSERT ile: bitiş ≥ başlangıç, `employeeNumber` değişmez, defter (ledger) silinmez/güncellenmez | **Check constraint**, **`immutable: true`**, `unchanged(...)` + `judge: 'onDelete'` | `ddl-sdl-check-constraints`, `ddl-sdl-keeping-values`, `ddl-sdl-column-rules` | Elevated sorgular ve akışlar dahil **her yazıcıyı** bağlar; ASSERT ve PREVENT ise bağlamaz | Düşük |
| 4 | Durum geçişleri (aktif → izinli → ayrıldı; talep pending → approved…) ASSERT ile | Efektif `status` kolonunda **geçiş kuralı** (her yazıcıyı bağlar). Talepler için `$old` kullanan **geçiş check'i** | `foundations-effective-dated-tables-declaring-a-column`, `ddl-sdl-check-constraints-transition-rules`, `foundations-workflow-columns` | Kurallar şemada; sorgu unutsa da korunur. Not: düz `state` (FSM) kolonu tek başına yetmez, onun yetki yarısı sadece kurallara tabi yazımları bağlar | Orta |
| 5 | Maaşı kim gördü, bilinmiyor; sadece PREVENT/GRANT var | Kolonu **`sensitive`** işaretlemek (`always`) → her okuma `system.access_logs`'a yazılır, elevated okumalar dahil. Ek olarak kurallarda **`minAal: 2`** ile ek doğrulama (step-up) | `dcl-policy-injection-assurance-logging-grants`, `foundations-audit-trail` | Maaş ve hastalık izni türü için "kim baktı" denetimi hazır gelir | Düşük |
| 6 | Talep notları ve karar notları düz metin kolon | **Satır yorumları** — `metadata.hasComments: true` → `_comments`, yanıtlar ve bahsetmeler (mention) gelen kutusuna düşer | `dcl-choosing-the-door`, `foundations-comments` | Çalışan–yönetici yazışması talebin üzerinde. İK'nın iç notları için doküman kendi tablonu önerir (`mentions: true`) | Düşük |
| 7 | Bildirimler sadece e-posta (`sendEmail`) | Akışta **Notify adımı** → uygulama içi bildirim (SDK gelen kutusu, okundu bilgisiyle) | `workflows-notify`, `foundations-app-notifications` | Onay/red sonucu uygulamanın zilinde görünür | Düşük |
| 8 | Çalışan belgesi yok, sadece `picture` | **Dosya kolonu** (`type: file`) + SDK `storage.attach`, yükleme onayı, görsel önizleme | `foundations-file-columns`, `sdk-storage`, `storage` | Sözleşme ve kimlik belgeleri satıra bağlı, kurallarla korunur | Düşük–orta |

## Daha küçük fırsatlar
- **Paylaşılan seçenek listeleri** (`create_choice_list`, `listId`): `employmentType` gibi seçenekler iki tabloda tekrar ediyor. Efektif kolonda çalıştığı doğrulanmadı, önce tek kolonda denenmeli (`types`, `foundations-data-types-semantics`).
- **Ekip metadatası doğrudan `auth.teams`'te:** sistem tablosuna eklenen kolon "built-in değildir, silinebilir" (`ddl-sdl-built-in-catalogue`). `org.units` 1:1 tablosu kaldırılabilirdi. Taşıma riski orta.
- **Canlı sorgular / realtime:** "Kim izinde", onaylar ve matris kendiliğinden güncellenebilir (`sdk-building-an-application`, `.live()`). İstemci şu an realtime kullanmıyor.
- **Act-as / Impersonation eklentisi:** İK desteği bir kullanıcının gördüğünü birebir görebilir (`dcl-policy-helpers`, `sdk-getting-started`).
- **Çalışma zamanı çevirileri:** izin türü adları TR/DE/EN olabilir. Efektif kolonlarda kullanılamaz (`foundations-runtime-translations`).

## Doğru yaptıklarımız (yerleşik karşılığı yok veya zaten kullanıyoruz)
- **Onay akışı:** etkileşim adımı, onaylayanı satırdan takip eden parametre (`follows`) ve kendi talebini onaylamayı engelleyen PREVENT zaten yerleşik özellikler.
- **Değişiklik geçmişi:** `system.change_log` ve `system.invocations` kullanılıyor. Rapor sorguları zaten `audit: 'arguments'`. Dışa aktarma kaydı (`rpt.export_events`) gerekli kalıyor, çünkü indirilen dosya formatını çağrı kaydı tutmuyor.
- **KVKK/GDPR:** veri talebi çıktısı, anonimleştirme ve saklama süresi için yerleşik bir özellik bulunamadı; elle yazmak doğruydu. Aylık akış doğru araç.
- **Dışa aktarma:** CSV/XLSX/PDF için yerleşik yok. Her named query zaten bir HTTP uç noktası (Published API).
- **`pto.seq` yardımcı tablosu:** `LOOP` en fazla 50 derinlik (`reference-limits`), `generate_series` yok; tablo kalmalı.
- **`pto.pending_recalcs`:** bu bir iş kuyruğu değil, insan onayı kuyruğu (önizle → uygula/reddet). Arka plan işleri (`foundations-background-jobs`) yerini tutmaz.
- **Otomatik çalışan numarası:** `serial` var ama "E-0042" gibi önek/biçim desteği bulunamadı; değeri düşük.

## Öneri
1–5 arası maddeler düşük–orta eforla güvenliği ve doğruluğu artırır. En hızlı kazanç 3 (check/immutable), 5 (`sensitive`) ve 1 (vekil atama ekranı). 2 numara review'dan açık kalan "yönetici değişikliği bir gün gecikir" sorununu kapatır.

## Uygulama durumu (2026-11-20)
| # | Durum |
|---|---|
| 3 | ✅ Check constraint'ler (tarih sırası, defter değişmez/silinmez). `employeeNumber` zaten `immutable` |
| 5 | ✅ `pto.requests.type` `sensitive: always`. Maaş ve ayrılma alanları zaten sensitive. `minAal: 2` uygulanmadı: demo kullanıcılarda yalnızca parola var |
| 1 | ✅ "Out of office" ekranı (`auth.createDelegation`). Devredilen onay "For <isim>" rozetiyle gösteriliyor, HR override sayılmıyor |
| 2 | ✅ `hr.syncMirrors` akışı (manager/office/department değişince aynalar anında). İleri tarihli dönemin başladığı anda tetiklenmesi yalnızca yazma ile test edildi |
| 4 | ✅ Çalışan durumu artık **efektif `state` kolonu**. Geçişleri motorun `timeline_` kuralı her yazıcıya uygular. Eski choice kolonu silindi, veriler taşındı. Talep durumu için `$old` check'i kaldı: düz `state` kolonunun geçiş yarısı yalnızca policy'ye tabi yazımları bağlıyor, bizim yazımlarımız elevated |
| 6 | ⛔ Duvar: `hasComments` MCP ile ayarlanamıyor (bulgu) |
| 7 | ✅ Notify adımı → uygulama içi bildirim |
| 8 | ◐ Kolon, kural ve `hr.setDocuments` hazır. İstemci yüklemesi `initUpload` 404 ile reddediliyor (bulgu). Ek: profil fotoğrafı (`auth.setMyPicture`) çalışıyor |
