# Wyndbase Bulguları — wynpeople

**Özet:** Bug: 1 · Eksik özellik: 0 · Keşfedilebilirlik: 1 · Duvar: 0 (toplam 2 bulgu; 2026-11-21 itibarıyla, tracker'a bildirilenler çıkarıldı)

---

## Server güncellemesinden sonra `??` operatörünün önceliği değişti; çalışan bir sorgu sessizce bozuldu
- **Görev:** Server güncellemesinden sonra (CLI/SDK `0.1.3-preview.gf00609c8` → `gf89ea3c1`) uygulamayı yeniden doğrulamak.
- **Kategori:** Bug
- **İlk deneme:** Hiçbir değişiklik yapmadan ana sayfayı açmak. `home.newHires` dün sorunsuz çalışıyordu:
  `FILTER status != 'terminated' AND hireDate <= current_date AND hireDate >= current_date - $days(type: int)::int ?? 30`
- **Sonuç:** Her çağrı `COALESCE types boolean and integer cannot be matched (ERR_POSTGRES_SERVER_ERROR, errno 42804, HTTP 400)` ile reddedildi. İfade artık `(hireDate >= current_date - $days) ?? 30` diye ayrıştırılıyor; önceden `current_date - ($days ?? 30)` diye ayrıştırılıyordu. Tanım yeniden derlenmeden, kayıtlı sorgu çalışma anında bozuldu. `typegen` ve `tsc` bunu yakalamadı; hatayı ancak tarayıcıda ağ isteklerini izleyerek bulabildim.
- **Sonraki denemeler:** `??`'yu parantez içine almak.
- **Çözüm / Workaround:** `current_date - ($days(type: int)::int ?? 30)`. Diğer `??` kullanımlarımız ya tek başına ya da zaten parantez içindeydi.
- **Durum:** Workaround ile çözüldü
- **Öneri:** Operatör önceliğini değiştiren bir sürüm ya kayıtlı sorguları yeniden derleyip kırılanları raporlamalı (yükseltme sırasında ya da `wyndbase check` ile), ya da değişiklik sürüm notlarında belirtilmeli. Hata mesajı da Postgres seviyesinde kalıyor; WQL'deki hangi ifadenin `COALESCE`'e dönüştüğünü söylemiyor.

---

## Registry'de olmayan bir sürüm öneriliyor; yükseltme sırasında 502/503
- **Görev:** Server güncellemesinden sonra CLI ve SDK'yı yükseltmek.
- **Kategori:** Keşfedilebilirlik
- **İlk deneme:** MCP sunucusunun talimatında yazan sürümü kurmak: `bun add -d @wyndbase/cli@0.1.3-preview.gebd64659`.
- **Sonuç:** Önce `GET https://dev.wyndbase.dev/npm/@wyndbase%2fcli - 502`. Registry geri geldiğinde `No version matching "0.1.3-preview.gebd64659"`. Registry yalnızca `0.1.3-preview.gf89ea3c1` sürümünü listeliyor; eski sürümler de kaldırılmış. Bu sırada `wyndbase pull` birkaç dakika `This base is being upgraded by another process. Retry shortly. (HTTP 503)` döndü.
- **Sonraki denemeler:** `dist-tags.latest` sürümünü (`gf89ea3c1`) kurmak; base yükseltmesi bitene kadar `pull`'u tekrar denemek.
- **Çözüm / Workaround:** `latest` etiketini kurmak; 503 için beklemek.
- **Durum:** Workaround ile çözüldü
- **Öneri:** MCP talimatındaki sürüm registry'deki `latest` ile aynı olmalı (ya da "latest" denmeli). Eski preview sürümleri kaldırılırsa, kilitli projeler `bun install` yapamaz. 503 mesajı tahmini bir süre verebilir.
