# wynpeople — UAT senaryosu

**Adres:** https://wynpeople.pages.dev · **Veri:** dev.wyndbase.dev, base `wynpeople` (demo verisi)
**Hazırlayan:** geliştirme ekibi · **Tarih:** 2026-11-21 · Önceki kabul listesi: [acceptance.md](acceptance.md) · English version: [uat_en.md](uat_en.md)

Bu belge her rolün baştan sona geçmesi gereken adımları, beklenen sonuçları ve hata bildirme biçimini içerir. Her adımın yanına ✅ (beklendiği gibi), ❌ (hata, aşağıdaki şablonla bildir) ya da ⚠️ (çalışıyor ama kafa karıştırıcı) koy.

---

## 1. Test kullanıcıları

Şifreler ayrıca iletilir. İlk girişte "wynpeople wants to access your account" ekranında **Authorize** denir. Her rol için ayrı bir tarayıcı profili (ya da gizli pencere) kullanın, oturumlar karışmasın.

| Kullanıcı | Kişi | Rol | Ofis | Notlar |
|---|---|---|---|---|
| `can.dev` | Can Öztürk | Çalışan | İstanbul | Yöneticisi Deniz |
| `deniz.eng` | Deniz Kaya | Yönetici | İstanbul | Can, Elif, Burak, Anna'nın yöneticisi; İK rolü yok |
| `mert.hrm` | Mert Demir | İK müdürü | İstanbul | Yalnızca İstanbul ofisini yönetir |
| `lena.hrm` | Lena Schmidt | İK müdürü | Berlin | Yalnızca Berlin ofisini yönetir |
| `ayse.hr` | Ayşe Yılmaz | İK admini | İstanbul | Her şeyi görür ve ayarlar |

---

## 2. Başlamadan önce bilinen durumlar

Bunlar bilinen ve kabul edilmiş durumlar; hata olarak bildirmeyin (farklı davranırlarsa bildirin):

- **PDF dışa aktarma:** Türkçe harfler (ş, ı, ğ) bozuk görünebilir. CSV ve XLSX doğru.
- **Gece yarısı ile 03:00 arası (İstanbul):** Sunucu tarihi UTC'dir. Bu saatlerde "bugün" sunucuya göre hâlâ dündür; o gün başlayan bir çalışanın departmanı ya da ofisi geçici olarak boş görünebilir.
- **Duyurular:** Şimdilik ana sayfadaki "What's happening" widget'ında görünür, bildirim ziline düşmez. Wyndbase'in yerleşik duyuru özelliği gelince değişecek.
- **Veri saklama (GDPR) akışı:** Aylık çalışır; UAT süresince tetiklenmeyebilir.
- **Platform:** Wyndbase bir önizleme (preview) sürümü. Platform güncellenirse bölüm 7'deki kısa kontrol tekrarlanır.
- **Pay periods:** Bir dönem yıl sınırını aşıyorsa (ör. 20 Aralık 2027 → 2 Ocak 2028) arayüzde bittiği yılın altında listelenir; silme de bitiş yılına göre çalışır.
- **Demo verisi:** Önceki testlerden kalan kayıtlar var (Anna'nın 2027 unvanı, Zz Demo, Deniz'in eski hastalık izni denemeleri; Deniz'in hastalık izni bakiyesi -8 h). Bunlar hata değil.

---

## 3. Hata bildirme şablonu

```
Başlık: <kısa, ne oldu>
Kullanıcı: <ör. can.dev>    Adım: <ör. E-04>
Ne yaptım: 1) … 2) … 3) …
Ne bekliyordum: …
Ne oldu: …  (ekran görüntüsü, mümkünse saat)
Tarayıcı: <Chrome / Safari …>
```

---

## 4. Rol senaryoları

### Çalışan — `can.dev`

| # | Adım | Beklenen |
|---|---|---|
| E-01 | Giriş yap, ana sayfayı aç | "Hi, Can" başlığı; Time off, What's happening, My approvals (boş), Who's out, Celebrations, New team members, Links, Department/Office widget'ları. **People without a pay raise, Length of service, Employment type görünmez.** |
| E-02 | Edit → bir widget'ı sürükle, boyutunu değiştir, birini kaldır, Add widget ile geri ekle, Done | Düzen kaydedilir; sayfayı yenileyince aynı kalır. Add widget listesinde İK widget'ları yok. |
| E-03 | Time off widget'ında oklarla türler arasında gez; hesap makinesi simgesi → 3 ay sonrası | Saat bakiyesi, planlanmış saatler; seçilen tarihteki tahmini bakiye (bugün + kazanılacak − planlanmış). |
| E-04 | My Info → Personal: tercih edilen adı, acil durum kişisini değiştir, kaydet; Education'a bir okul ekle, düzenle, sil | Kaydedilir; eğitim kaydı listelenir, düzenlenir, silinir. Bitiş tarihi başlangıçtan önceyse uyarı. |
| E-05 | My Info → Job | İş geçmişi tabloları görünür; **Compensation tablosunda yalnızca kendi maaşı görünür** (salt okunur); Add change / Correct düğmeleri yok. Bir iş arkadaşının profilinde Compensation görünmez. |
| E-06 | My Info → Time Off | Bakiyeler, Upcoming Time Off, Balance history grafiği (geçmiş düz çizgi, gelecek soluk/kesikli, "Today" çizgisi); tabloda planlanmış kazanımlar ve izinler işaretli. |
| E-07 | Time Off → Request time off: 2 günlük talep, bir günü 4 saat yap, gönder | Talep "Pending" görünür; saat toplamı 12 h; Deniz'e onay isteği gider. |
| E-08 | Aynı talebi iptal et | Durum "Canceled"; Deniz'in inbox'ından düşer. |
| E-09 | People → dizin; bir iş arkadaşının profilini aç | İş e-postaları görünür; başkasının adresi, telefonu, maaşı görünmez. Org chart açılır. |
| E-10 | Reports → Standard reports | Yalnızca çalışana açık raporlar (dizin, kendi bakiyeleri, kullanım, özet, müsaitlik, funnel, scheduled time off, new hires). Terminations, Salary changes, Export log, Audit log **yok**. Settings menüsü yok. |
| E-11 | Bir raporu filtrele → Save report → isim ver; My reports'ta aç | Rapor listede; Last viewed güncellenir. |

### Yönetici — `deniz.eng`

| # | Adım | Beklenen |
|---|---|---|
| M-01 | Önce `can.dev` ile yeni bir izin talebi gönder; sonra Deniz ile gir | Bildirim zilinde ve "My approvals" widget'ında talep görünür; Review → Time Off. |
| M-02 | Talebi bir notla onayla | Durum "Approved"; "HR override" etiketi **yok**; Can'a uygulama bildirimi ve e-posta gider. |
| M-03 | Can olarak ikinci bir talep gönder; Deniz ile reddet | "Denied"; Can bildirim alır. |
| M-04 | Time Off → Out of office: Burak'a bir haftalığına onay yetkisi ödünç ver | Burak listede; Burak giriş yapınca Deniz'in ekibinin taleplerini "For Deniz" etiketiyle görür ve cevaplayabilir. "End now" ile geri al. |
| M-05 | Can'ın profilini aç | Geçmiş iş dönemleri görünür; Compensation **görünmez**. |
| M-06 | Ana sayfa → Time off used widget'ı | Kendisinin ve ekibinin onaylı izinleri, aylara ve türe göre. |
| M-07 | Reports → My reports: Can'ın kaydettiği bir rapor varsa paylaşılmadıkça görünmez | Başkasının raporu paylaşılmadan görünmez. |

### İK müdürü — `mert.hrm` (İstanbul) ve `lena.hrm` (Berlin)

| # | Adım | Beklenen |
|---|---|---|
| H-01 | People → kendi ofisinden biri | Compensation görünür; Add change / Correct / Terminate düğmeleri var. |
| H-02 | People → **diğer** ofisten biri | Compensation görünmez; değişiklik düğmeleri yok. |
| H-03 | Kendi ofisinden birine geçmiş tarihli bir iş değişikliği (ör. çalışma tipi) yap | Değişiklik geçmişte yeni dönem olarak görünür; Settings → Recalculations'a yeni kayıt düşer ve **bildirim ziline "PTO recalculation" isteği gelir**. |
| H-04 | Zildeki recalculation isteğine tıkla → Preview → Apply (ya da Dismiss) | Settings → Recalculations açılır, kayıtta "In your inbox" rozeti; birkaç saniye içinde "Applied" / "Dismissed" olur; zil temizlenir. Diğer ofisin İK müdürü bu isteği görmez. |
| H-05 | Settings'in diğer sayfaları | Organization, Types, Policies, Pay periods, Holidays salt okunur. |
| H-06 | Ana sayfa: People without a pay raise, Length of service, Employment type widget'ları | Görünür; yalnızca kendi ofisinin kişileri. |
| H-07 | Reports → Time off balances, Salary changes | Yalnızca kendi ofisi. CSV dışa aktar → Export log'da görünür. |
| H-08 | Ana sayfa → New… → Announcement: bir duyuru yayınla | Herkesin "What's happening" widget'ında görünür. |

### İK admini — `ayse.hr`

| # | Adım | Beklenen |
|---|---|---|
| A-01 | People → New employee: işe alım sihirbazını tamamla | Kişi dizinde; zorunlu alan boşsa Next pasif; set-password e-postası gider. |
| A-02 | Settings → Organization: bir birimin üzerine gel → "+ Add …" ile alt birim ekle; en altta kök birim ekle; sürükleyerek taşı; yeniden adlandır; pasifleştir | Ağaç güncellenir; pasif birim soluk görünür. |
| A-03 | Settings → Policies: "+ New policy" ile yeni bir ülke için politika oluştur (ülke listesi tüm ülkeleri içerir) | Politika listede. Aynı tür, ülke ve çalışma tipi için ikinci politika uyarı verir. |
| A-04 | Bir politikayı geçmiş tarihten düzenle | Recalculation kaydı ve zile istek düşer; Preview etkilenen kişileri gösterir. |
| A-05 | Settings → Pay periods: bir ülke ve yıl için dönem üret; "Delete N upcoming" ile gelecek dönemleri sil | Geçmiş dönemler silinmez; onay penceresi çıkar. |
| A-06 | Settings → Holidays: "Copy from previous year", bir tarihi düzelt, Activate | Tatiller aktif; izin taleplerinde o günler sayılmaz. |
| A-07 | Settings → Users & roles: bir role ekle ve çıkar; Data retention; Audit log | Değişiklik Audit log'da görünür. |
| A-08 | Reports → My reports: "Scheduled time off" raporunu kaydet, Share ile Deniz'e paylaş | Deniz'in My reports listesinde "Owner: Ayşe" olarak görünür; Can'da görünmez. Ayşe silince Deniz'den de kalkar. |
| A-09 | Reports → Terminations, Salary changes, New hires | Tüm ofisler; filtreler ve dışa aktarma çalışır. |
| A-10 | Ana sayfa → Links widget'ına bir şirket bağlantısı ekle | Herkesin ana sayfasında görünür. |

---

## 5. Roller arası senaryolar

| # | Senaryo | Beklenen |
|---|---|---|
| X-01 | Can talep → Deniz onay → Can ileri tarihli onaylı talebi başlamadan iptal | Bakiye geri gelir; izin günü takvimden kalkar. |
| X-02 | Can, izni başladıktan sonra iptal etmeye çalışır | Reddedilir: "ask HR after that". Mert (İK, İstanbul) iptal edebilir. |
| X-03 | Can, kendi talebini onaylamaya çalışamaz; Deniz kendi talebini onaylayamaz | Kendi talebi onay listesine düşmez; yöneticisi olmayan birinin talebi ofisin İK'sına gider. |
| X-04 | Who's out ve Team availability | Onaylı izinler görünür; başkasının izin **türü** ve notu yalnızca yetkili kişilere görünür. |

---

## 6. Kapanış ölçütü

UAT, aşağıdakiler sağlanınca tamamlanmış sayılır:

- Bütün adımlar ✅, ya da ⚠️ olanlar için karar verilmiş;
- ❌ olanların hepsi düzeltilmiş ve ilgili adım tekrar geçilmiş;
- Bir İK admini ve bir İK müdürü "canlıya alınabilir" onayı vermiş.

---

## 7. Platform güncellemesinden sonra kısa kontrol (geliştirici)

Wyndbase güncellendiğinde (her biri birkaç dakika):

1. Ana sayfayı Ayşe ile aç; tarayıcı konsolunda ve ağ sekmesinde 400/500 yok.
2. Time Off, Reports, Settings, People sayfaları açılıyor.
3. `bunx wyndbase pull` → tipler değiştiyse build ve testleri çalıştır.
4. Bir test talebi gönder ve iptal et (Zz Demo).
