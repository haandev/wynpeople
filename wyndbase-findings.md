# Wyndbase Bulguları — wynpeople

**Özet:** Bug: 0 · Eksik özellik: 2 · Keşfedilebilirlik: 2 · Duvar: 0 (toplam 4 bulgu; 2026-11-21 itibarıyla, tracker'a bildirilenler çıkarıldı)

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

## `generate_series` yalnızca tek başına bir ifade olarak çalışıyor; süzülemiyor, başka bir ifadeye girdi olamıyor
- **Görev:** Bir tarih aralığındaki iş günlerini gün gün döndürmek (`pto.workingHours`, `pto.previewHours`: hafta sonu ve tatiller hariç) ve bir koşul doğruysa tek satır eklemek.
- **Kategori:** Eksik özellik
- **İlk deneme:** Fonksiyonu tablo gibi kullanmak: `SELECT generate_series(…) AS d { d }`. Ayrıştırıcı reddetti.
- **Sonuç:** Maintainer'lar "var, yapılabiliyor" dedi. Doğru: Functions makalesinde "Generate series" grubu var ve `SELECT { d := generate_series(current_date, current_date + 3, '1 day'::interval)::date }` 4 satır döndürüyor. Ama sonucu süzmek için `$days := SELECT { … }; SELECT $days { d } FILTER …` yazınca reddediliyor: `A SELECT with no table stands only as a statement of its own: not as a named result, … in parentheses, … or as the read of LOOP or INSERT EACH.` İlk aramamda "generate_series" sözcüğünü tek başına aramadığım için bu satırı görmemiştim.
- **Sonraki denemeler:** Gün listesini 0'dan başlayan bir sayı tablosundan (`pto.seq { n }`) türetmek ve `FILTER` ile hafta sonu ve tatilleri çıkarmak. Bu, ilk günden beri kullandığımız yol.
- **Çözüm / Workaround:** `pto.seq` sayı tablosu.
- **Durum:** Workaround ile çözüldü. Maintainer'lar eksikliği doğruladı ve kayda geçirdi (2026-11-21).
- **Maintainer cevabı:** İlk "yapılabiliyor" cevabı yanlışmış. Satır üreten fonksiyonlar şu an tablo gibi okunamıyor: süzülemiyor, bir isme bağlanamıyor, `INSERT EACH`'e girdi olamıyor. Hedeflenen yazım `SELECT generate_series(…) AS d { d } FILTER …`; o gelene kadar `pto.seq` ile devam. Uyarı: `SELECT { d := generate_series(…) }` biçiminin satır döndürmesi belgelenmiş bir davranış değil, değişebilir. Bu biçimi kodda hiçbir yerde kullanmıyoruz.
- **Öneri:** `SELECT generate_series(…) AS d { d } FILTER …` biçimi desteklenmeli. Gelince `pto.seq` kullanan 4 sorgu (`pto.workingHours`, `pto.previewHours`, onay akışındaki defter yazımı, `hr.changeJob` / `correct*` yamalarındaki koşullu INSERT) sayı tablosu olmadan yazılabilir. Bu arada tek başına `SELECT { … generate_series … }` biçiminin desteklenmediği, bilgi tabanındaki "SELECT with no table" makalesinde belirtilebilir.

---

## CLI her çağrıda yeni token istiyor; art arda çağrılar IP istek sınırına takılıyor
- **Görev:** UAT öncesi duman testi: dört rol için sayfaların kullandığı 20'şer named query'yi `bunx wyndbase wql --act-as <kullanıcı> <sorgu>` ile bir betikte çalıştırmak.
- **Kategori:** Eksik özellik
- **İlk deneme:** Çağrıları arka arkaya çalıştırmak (döngü içinde, bekleme olmadan).
- **Sonuç:** Yaklaşık 40 çağrıdan sonra her çağrı `wyndbase://dev.wyndbase.dev refused the token request: Too many requests from this IP. Please slow down.` hatası verdi. Hata token isteğinde; yani CLI her çalıştırmada token'ı yeniden alıyor, saklamıyor.
- **Sonraki denemeler:** 60 saniye bekleyip her çağrının önüne 2 saniye koymak.
- **Çözüm / Workaround:** Çağrıları yavaşlatmak; ya da MCP `run_wql` ile `targetUserId` kullanmak (aynı oturum, token isteği yok).
- **Durum:** Workaround ile çözüldü
- **Öneri:** CLI, geçerliliği bitene kadar token'ı yerelde saklayıp yeniden kullanmalı (en azından aynı kullanıcı ve aynı `--act-as` için). Ayrıca birden çok sorguyu tek oturumda çalıştıran bir mod (ör. `wql --batch file.jsonl`) betik yazanların işini kolaylaştırır. Hata mesajı, sınırın token isteğinde olduğunu ve ne kadar bekleneceğini söyleyebilir.

---

## Belgelenmiş `system.interactions` süzgeci her çağrıda UNINDEXED_FILTER uyarısı veriyor; kullanıcı düzeltemiyor
- **Görev:** Onay ve yeniden hesap isteklerini adımına göre listelemek (`pto.myApprovals`, `pto.recalcReviews`: `SELECT system.interactions { … } FILTER stepKey == '<space>.<flow>.<node>'`).
- **Kategori:** Keşfedilebilirlik
- **İlk deneme:** Interaction adımı makalesindeki biçimde `stepKey` ile süzmek.
- **Sonuç:** Sorgu çalışıyor, ama her tanımlamada ve çalıştırmada `A filter reads system.interactions.step, which has no index … Turn on optimizeFilter on the column.` uyarısı çıkıyor. Kolon motorun tanımladığı bir sistem kolonu; belgeye göre böyle kolonların bayrakları uygulama sahibince değiştirilemiyor (`drop_constraint` / `update_column` açıklamaları). Uyarı, kullanıcının yapamayacağı bir şeyi öneriyor. Ben değiştirmeyi denemedim.
- **Sonraki denemeler:** Yok.
- **Çözüm / Workaround:** Uyarıyı görmezden gelmek. Satır sayısı küçük olduğu için şimdilik sorun değil.
- **Durum:** Workaround ile çözüldü
- **Öneri:** `system.interactions.step` (ve belgede süzgeç olarak önerilen diğer sistem kolonları) varsayılan olarak indeksli gelmeli; ya da sistem kolonlarında bu uyarı bastırılmalı. Bir onay kuyruğu büyüdükçe bu süzgeç her inbox açılışında tam tarama yapar.

