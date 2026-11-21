# Wyndbase Bulguları — wynpeople

**Özet:** Bug: 0 · Eksik özellik: 1 · Keşfedilebilirlik: 1 · Duvar: 0 (toplam 2 bulgu; 2026-11-21 itibarıyla, tracker'a bildirilenler çıkarıldı)

---

## `system.user_preferences` var ama belgelenmemiş; kullanıcı başına uygulama ayarı için hangi kapının doğru olduğu belirsiz
- **Görev:** Ana sayfa panosunun kişiye özel düzenini saklamak. Sonradan, kendi kurduğumuz yapının yerine hazır bir yapı olup olmadığını denetlemek.
- **Kategori:** Keşfedilebilirlik
- **İlk deneme:** Kendi tablomuz `home.dashboards { owner (user, unique), layout (json) }` ve `home.myLayout` / `home.saveMyLayout` sorguları. Bu yapı çalışıyor.
- **Sonuç:** Denetimde `system.user_preferences { user (cascade), config jsonb }` tablosunu buldum; bizim tablomuzla birebir aynı biçimde. Ama:
  - Bilgi tabanında bu tabloyu anan bir makale yok. `system.searchArticles` ile "user_preferences per-user settings layout preference" ve "system.user_preferences config" diye aradım; dönen makalelerin hiçbiri bu tabloyla ilgili değildi.
  - Tablo boş. Sıradan bir kullanıcı (can.dev, act-as) okuyunca 0 satır alıyor; okuma ya da yazma izni tanımlı değil.
  - Konsolun mu yoksa uygulamaların mı kullanması gerektiği, `config` içinde anahtar paylaşımının (namespace) nasıl yapılacağı yazmıyor.
- **Sonraki denemeler:** Yok. Belgelenmemiş bir sistem tablosunu sözleşme saymadım.
- **Çözüm / Workaround:** Kendi tablomuzda kaldık.
- **Durum:** Workaround ile çözüldü
- **Öneri:** Tablo uygulamalar için düşünüldüyse bir makale yazılmalı: kim okur ve yazar, `config` içinde anahtarlar nasıl paylaşılır, hazır bir `GRANT … FILTER user == $context.userId` örneği. Yalnızca konsol içinse, uygulamaların kendi tablosunu kurması gerektiği açıkça söylenmeli.

---

## Satır üreten bir kaynak yok (`generate_series` karşılığı); sayı tablosu kurmak gerekiyor
- **Görev:** Bir tarih aralığındaki iş günlerini ve saatlerini gün gün döndürmek (`pto.workingHours`, `pto.previewHours`). Ayrıca bir koşul doğruysa tek satır eklemek (`INSERT pto.pending_recalcs EACH (…)`).
- **Kategori:** Eksik özellik
- **İlk deneme:** `generate_series` ile gün listesi üretmek.
- **Sonuç:** WQL'de tablo yerine bir fonksiyonun döndürdüğü satırları okumanın yolunu bulamadım. `system.searchArticles` ile "generate_series series of dates rows numbers" ve "set-returning function generate_series unnest FROM function rows" diye aradım; dönen makalelerde (Functions, SELECT with no table, Insert) böyle bir kaynak yok. "SELECT with no table" tek satır döndürüyor ve filtrelenemiyor.
- **Sonraki denemeler:** 0'dan başlayan sayıları tutan bir tablo (`pto.seq { n }`) kurup `FILTER n <= …` ile gün listesi, `FILTER n == 0 AND <koşul>` ile koşullu tek satır üretmek.
- **Çözüm / Workaround:** `pto.seq` sayı tablosu.
- **Durum:** Workaround ile çözüldü
- **Öneri:** Gün ve sayı serileri için bir satır kaynağı sunulmalı (ör. `SELECT series(1, $n) { n }` ya da `generate_series` desteği). Koşullu tek satır için `SELECT { … } FILTER <koşul>` kabul edilebilir. Bu iki desen HR, rezervasyon ve takvim uygulamalarında sık geçiyor.
