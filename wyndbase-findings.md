# Wyndbase Bulguları — wynpeople

**Özet:** Bug: 0 · Eksik özellik: 1 · Keşfedilebilirlik: 2 · Duvar: 0 (toplam 3 bulgu; 2026-11-21 itibarıyla, tracker'a bildirilenler çıkarıldı)

---

## `SUMMARIZE … BY` grup kolonuna ad verilemiyor; dönen anahtar ifadeden türetiliyor
- **Görev:** Ana sayfa panosu için kişi sayısı dağılımları (departman, ofis, kıdem, çalışma tipi) ve aylık izin kullanımı (`home.byDepartment`, `home.byTenure`, `home.timeOffUsed`).
- **Kategori:** Eksik özellik
- **İlk deneme:** Projeksiyonda ad verip ona göre gruplamak: `SUMMARIZE hr.employees { label := coalesce(department.name, 'No department'), n := count(*) } BY label`.
- **Sonuç:** `Column "label" not found in model (HTTP 400)`. `BY label := …` yazımı da ayrıştırıcıda hata veriyor (`mismatched input ':='`).
- **Sonraki denemeler:** `BY department.name` ve `BY CASE(...)` çalıştı. Ancak dönen satırlarda grup kolonunun adı ifadeden türetiliyor: `name`, `employmentType`, `expr`, `to_char`. Aynı sorguda iki ifade olsaydı adlar çakışabilirdi.
- **Çözüm / Workaround:** İstemci, `n` dışındaki anahtarı etiket olarak okuyor.
- **Durum:** Workaround ile çözüldü
- **Öneri:** `BY` içindeki ifadeye ad verilebilmeli (`BY label := expr`), ya da projeksiyondaki bir ada göre gruplanabilmeli (SQL'deki `GROUP BY 1` / takma ad gibi). Şu an üretilen anahtar adı tipte de belirsiz, istemci kodu tahmine dayanıyor.

---

## Tabloyla aynı adı taşıyan sorgu tanımlanamıyor; hata mesajı nedeni söylemiyor
- **Görev:** Şirket bağlantıları için `home.links` tablosu ve onu listeleyen `home.links` adlı sorgu.
- **Kategori:** Keşfedilebilirlik
- **İlk deneme:** `DEFINE OR REPLACE elevated public home.links … AS SELECT home.links { … }`.
- **Sonuç:** `Model 'links' already exists in parent (HTTP 422)`. Tablolarla sorguların aynı ad alanını paylaştığı mesajdan anlaşılmıyor.
- **Sonraki denemeler:** Sorguyu `home.listLinks` olarak adlandırınca tanım geçti.
- **Çözüm / Workaround:** Sorguya farklı bir ad vermek.
- **Durum:** Workaround ile çözüldü
- **Öneri:** Mesaj çakışan nesneyi açıkça söylemeli: ör. "`home.links` is already a table; a named query cannot share its name". `wyndbase check` bunu yerelde yakalamalı; şu an `[]` (sorunsuz) dönüyor.

---

## CLI `wql --act-as` ile yazma reddediliyor; gereken bayrak CLI'da yok
- **Görev:** `home.saveMyLayout` sorgusunu sıradan bir çalışan (can.dev) adına denemek.
- **Kategori:** Keşfedilebilirlik
- **İlk deneme:** `bunx wyndbase wql --act-as can.dev "home.saveMyLayout" --params '{"layout":{…}}'`.
- **Sonuç:** `Mutation queries require allowMutation: true when user mode is active (HTTP 403)`. `wyndbase wql --help` içinde `allowMutation`'a karşılık gelen bir seçenek yok.
- **Sonraki denemeler:** Okuma sorguları `--act-as` ile çalıştı. Yazmayı uygulamada, o kişi olarak giriş yapıp tarayıcıdan test ettim.
- **Çözüm / Workaround:** Yazmaları başka biri adına test etmek için uygulamaya o kişiyle girmek.
- **Durum:** Workaround ile çözüldü
- **Öneri:** CLI'a `--allow-mutation` (ya da MCP'deki `confirm` gibi) bir bayrak eklenmeli; hata mesajı da o bayrağı adıyla söylemeli.

---
