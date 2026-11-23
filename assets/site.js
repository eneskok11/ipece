(function(){
  "use strict";
  var $ = function(s, k){ return (k||document).querySelector(s); };
  var kat = function(s){ return (s||"").toLocaleLowerCase("tr"); };
  var esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]; }); };
  var kok = document.documentElement.getAttribute("data-kok") || "";
  var tl = function(n){ return n.toLocaleString("tr-TR", {maximumFractionDigits: 2}) + " TL"; };

  /* mobil menü */
  var md = $(".menu-dugme"), mn = $(".menu");
  if (md && mn) md.addEventListener("click", function(){
    var acik = mn.classList.toggle("acik");
    md.setAttribute("aria-expanded", acik ? "true" : "false");
    md.textContent = acik ? "Kapat" : "Menü";
  });

  var V = window.IPECE;

  /* ---------- F1 tutar motoru: 5510 tutarları katsayı × asgari ücret ---------- */
  var depo = {
    al: function(a, v){ try { var x = localStorage.getItem(a); return x === null ? v : JSON.parse(x); } catch (_) { return v; } },
    koy: function(a, v){ try { localStorage.setItem(a, JSON.stringify(v)); return true; } catch (_) { return false; } }
  };
  var PARAM = { au: (V && V.au) || 33030, esik: (V && V.esik) || 100000 };
  var kayitli = depo.al("ipece-param", null);
  if (kayitli) { if (kayitli.au > 0) PARAM.au = kayitli.au; if (kayitli.esik > 0) PARAM.esik = kayitli.esik; }
  var sayiYaz = function(n){ return n.toLocaleString("tr-TR", {minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2}); };
  var satirTutar = function(x){
    if (!x.kat || !x.tpl) return x.tutar;
    var t = x.tpl.replace(/\{(\d+)\}/g, function(_, i){ return sayiYaz(Math.round(x.kat[+i] * PARAM.au * 100) / 100); });
    return /^[\d.,\s\/–]+$/.test(t) ? t + " TL" : t.replace(" /", " TL /");
  };
  var satirBt = function(x){ return x.kat && x.bt ? x.kat[0] * PARAM.au : x.bt; };
  var satirUst = function(x){ return x.kat ? Math.max.apply(null, x.kat) * PARAM.au : x.ust; };
  var bul = function(slug){ return V && V.satir.filter(function(x){ return x.slug === slug; })[0]; };
  /* yaptırım defterinde (panel) yayınlanan düzeltmeler: tutarı katsayıya bağlı olmayan satırlar */
  var DEFTER = depo.al("ipece-defter", {});
  var sayilar = function(t){ return (String(t).match(/\d{1,3}(?:\.\d{3})*(?:,\d+)?/g) || []).filter(function(n){ return !/^20\d\d$/.test(n); }).map(function(n){ return parseFloat(n.replace(/\./g, "").replace(",", ".")); }); };
  if (V) V.satir.forEach(function(x){
    var d = DEFTER[x.slug];
    if (d && d.yayinda && d.tutar && !x.kat) {
      var dt = d.tutar.trim();
      x.tutar = /TL/.test(dt) || !/^\d/.test(dt) ? dt : (/\s\//.test(dt) ? dt.replace(/\s\//, " TL /") : dt + " TL");
      x.dogru = !/doğrulan/i.test(d.tutar);
      var ns = sayilar(d.tutar); x.ust = ns.length ? Math.max.apply(null, ns) : null;
      if (x.bt && ns.length === 1) x.bt = ns[0];
    }
  });
  if (V) {
    V.satir.forEach(function(x){ x.tutar = satirTutar(x); x.bt = satirBt(x); x.ust = satirUst(x); });
    Array.prototype.forEach.call(document.querySelectorAll("dd[data-satir]"), function(d){ var x = bul(d.getAttribute("data-satir")); if (x) d.textContent = x.tutar; });
    var hsx = $("#hesap[data-satir]"); if (hsx) { var hx = bul(hsx.getAttribute("data-satir")); if (hx && hx.bt) hsx.setAttribute("data-bt", hx.bt); }
  }
  window.IPECE_PARAM = PARAM;

  /* ---------- F3 geri arama: eşik üstü tutarda telefon alınır, talep panele düşer ---------- */
  var talepEkle = function(t){
    var l = depo.al("ipece-talepler", []);
    t.id = "T" + Date.now().toString(36).toUpperCase(); t.tarih = new Date().toISOString(); t.durum = "Yeni";
    l.unshift(t); return depo.koy("ipece-talepler", l) ? t : null;
  };
  var geriArama = function(kap, x, tahmin){
    var ust = tahmin != null ? tahmin : (x ? x.ust : null);
    var esikUstu = ust != null && ust >= PARAM.esik;
    var baslik = esikUstu ? "Bu tutar yüksek: hukukçumuz sizi arasın" : "Bu madde için hukukçumuz sizi arasın";
    var aciklama = esikUstu ? "Tahmini tutar " + sayiYaz(ust) + " TL. Telefonunuzu bırakın, uzmanımız dosyanızı sizinle değerlendirsin." : "Telefonunuzu bırakın, uzmanımız sizi arasın.";
    kap.innerHTML = "<section class=\"geri-arama" + (esikUstu ? " esik" : "") + "\" aria-labelledby=\"ga-b\"><h2 id=\"ga-b\">" + baslik + "</h2><p>" + aciklama + "</p>" +
      "<form class=\"ga-form\"><label>Ad soyad<input name=\"ad\" autocomplete=\"name\" required></label><label>Telefon<input name=\"tel\" type=\"tel\" inputmode=\"tel\" autocomplete=\"tel\" required pattern=\"[0-9 +()\\-]{10,}\"></label>" +
      "<label class=\"tam\">Kurum<input name=\"kurum\" autocomplete=\"organization\" value=\"" + esc(depo.al("ipece-son-kurum", "")) + "\"></label>" +
      "<label class=\"onay tam\"><input type=\"checkbox\" name=\"onay\" required> Telefon numaramın yalnız bu talep için aranmak amacıyla kullanılmasını kabul ediyorum.</label>" +
      "<button class=\"dugme\" type=\"submit\">Beni arayın</button></form><div class=\"ga-sonuc\" role=\"status\" hidden></div></section>";
    var f = $(".ga-form", kap);
    f.addEventListener("submit", function(ev){
      ev.preventDefault();
      var d = new FormData(f);
      var t = talepEkle({ ad: d.get("ad"), tel: d.get("tel"), kurum: d.get("kurum"), kod: x ? x.kod : "", yuk: x ? x.yuk : "", slug: x ? x.slug : "", tahmin: ust, esikUstu: esikUstu, sayfa: location.pathname,
        sohbet: depo.al("ipece-son-sohbet", []), bildirim: "bagli-degil" });
      try { var so = depo.al("ipece-sohbet", []); if (so[0]) { so[0].talep = true; depo.koy("ipece-sohbet", so); } } catch (_) {}
      var s = $(".ga-sonuc", kap); s.hidden = false; f.hidden = true;
      s.innerHTML = t ? "<strong>Talebiniz alındı.</strong> Talep numaranız " + t.id + ". Uzmanımız sizi arayacak.<br><span class=\"kucuk\">Önizleme: talep bu tarayıcıdaki yönetim paneline düştü. Balrium'a anlık bildirim henüz bağlı değil.</span>"
                      : "Talebiniz kaydedilemedi. Tarayıcınız yerel kaydı engelliyor olabilir; lütfen <a href=\"" + kok + "iletisim/\">iletişim sayfasından</a> yazın.";
    });
  };
  var ga = $("#geri-arama");
  if (ga && V) geriArama(ga, bul(ga.getAttribute("data-satir")));
  window.IPECE_GERIARAMA = geriArama;

  /* yükümlülük listesi */
  var tb = $("#liste-govde");
  if (tb && V) {
    var sk = $("#s-kanun"), sa = $("#s-ara"), sh = $("#s-hesap"), sy = $("#sonuc-say");
    var q = new URLSearchParams(location.search);
    if (q.get("q")) sa.value = q.get("q");
    var h = location.hash.match(/^#k(\d{4})$/); if (h) sk.value = h[1];
    if (q.get("kanun")) sk.value = q.get("kanun");
    var ciz = function(){
      var k = sk.value, s = kat(sa.value.trim()), yh = sh.checked;
      var r = V.satir.filter(function(x){
        if (k && x.k !== k) return false;
        if (yh && !x.bt) return false;
        if (s && kat([x.kod, x.yuk, x.ihlal, x.sonuc, x.veri, V.kanun[x.k]].join(" ")).indexOf(s) < 0) return false;
        return true;
      });
      tb.innerHTML = r.map(function(x){
        var t = x.dogru ? "<td class=\"tutar\">" + esc(x.tutar) + "</td>" : "<td class=\"dogrulanmadi\">" + esc(x.tutar) + "</td>";
        return "<tr><td><span class=\"kod\">" + esc(x.kod) + "</span></td><td><a href=\"" + kok + "yukumlulukler/" + x.slug + "/\">" + esc(x.yuk) + "</a>" +
          (x.bt ? "<br><span class=\"hesap-isaret\">Hesaplayıcı var</span>" : "") + "</td><td>" + esc(x.ihlal) + "</td>" + t + "</tr>";
      }).join("") || "<tr><td colspan=\"4\">Bu süzgeçle eşleşen yükümlülük yok. Aramayı kısaltmayı ya da kanun seçimini kaldırmayı deneyin.</td></tr>";
      sy.textContent = r.length + " yükümlülük listeleniyor" + (k ? " · " + k + " sayılı " + V.kanun[k] : "") + ".";
    };
    [sk, sh].forEach(function(e){ e.addEventListener("change", ciz); });
    sa.addEventListener("input", ciz);
    ciz();
  }

  /* hesaplayıcı */
  var hs = $("#hesap");
  if (hs) {
    var bt = parseFloat(hs.getAttribute("data-bt")), ayli = hs.hasAttribute("data-ay");
    var ad = $("#h-adet"), ay = $("#h-ay"), out = $("#h-sonuc");
    var gaKap = $("#geri-arama"), gaDurum = null;
    var hesapla = function(){
      var a = parseInt(ad.value, 10) || 0, m = ayli ? (parseInt(ay.value, 10) || 0) : 1;
      var top = (a > 0 && m > 0) ? bt * a * m : null;
      out.textContent = top != null ? tl(top) : "—";
      var ust = top != null && top >= PARAM.esik;
      if (gaKap && ust !== gaDurum && !$(".ga-sonuc:not([hidden])", gaKap)) { gaDurum = ust; geriArama(gaKap, bul(gaKap.getAttribute("data-satir")), top); }
    };
    ad.addEventListener("input", hesapla); if (ay) ay.addEventListener("input", hesapla); hesapla();
  }

  /* yüzdeli formül hesaplayıcı (ör. hizmet bedelinin %10'u, en az X) */
  var hy = $("#hesap-yuzde");
  if (hy) {
    var oran = parseFloat(hy.getAttribute("data-oran")), enAz = parseFloat(hy.getAttribute("data-min")) || 0;
    var hb = $("#hy-bedel"), ho = $("#hy-sonuc"), gaY = $("#geri-arama"), sonY = null;
    var hyHesap = function(){
      var b = parseFloat(hb.value);
      var t = b > 0 ? Math.max(b * oran / 100, enAz) : null;
      ho.textContent = t != null ? tl(t) : "—";
      var u = t != null && t >= PARAM.esik;
      if (gaY && u !== sonY && !$(".ga-sonuc:not([hidden])", gaY)) { sonY = u; geriArama(gaY, bul(gaY.getAttribute("data-satir")), t); }
    };
    hb.addEventListener("input", hyHesap); hyHesap();
  }

  /* panelde yayınlanan makale: künyenin altında görünür */
  var ym = $("#yerel-makale");
  if (ym) {
    var mk = depo.al("ipece-makaleler", {})[ym.getAttribute("data-satir")];
    if (mk && mk.yayinda && mk.metin) {
      ym.hidden = false;
      ym.className = "yerel-makale";
      ym.innerHTML = "<p class=\"ust-baslik\">Makale · Balrium</p><h2>" + esc(mk.baslik) + "</h2>" +
        mk.metin.split(/\n\s*\n|\n/).filter(function(p){ return p.trim(); }).map(function(p){ return "<p>" + esc(p.trim()) + "</p>"; }).join("") +
        "<p class=\"kucuk\">Yayın: " + new Date(mk.yayinTarihi).toLocaleDateString("tr-TR") + " · Önizleme: bu makale panelden bu tarayıcıda yayınlandı.</p>";
    }
  }

  /* soru asistanı: yalnız yükümlülük kayıtlarından yanıt verir, her yanıt kaynağa bağlanır */
  var af = $("#asistan-form");
  if (af && V) af.addEventListener("submit", function(e){
    e.preventDefault();
    var c = $("#asistan-yanit"), q = kat($("#asistan-soru").value);
    c.hidden = false;
    var AD = {"kvkk":"6698","kişisel veri":"6698","sgk":"5510","iş kanunu":"4857","tüketici":"6502","imar":"3194","çevre":"2872","trafik":"2918","taşıma":"4925","engelliler":"5378"};
    var no = (q.match(/\b(2872|2918|3194|4857|4925|5378|5510|6502|6698)\b/) || [])[1];
    if (!no) { var a = Object.keys(AD).filter(function(x){ return q.indexOf(x) >= 0; })[0]; if (a) no = AD[a]; }
    var md2 = (q.match(/\b\d{4}\s*(?:\/|sayılı kanun(?:un)?|m\.?|madde)\s*(\d{1,3})/) || q.match(/(?:madde|m\.)\s*(\d{1,3})/) || [])[1];
    var r = V.satir.filter(function(x){ return (!no || x.k === no) && (!md2 || x.kod.split("·")[1].trim().split(/[\/ ]/)[0] === md2); });
    if (!md2) {
      var BOS = ["ceza","cezası","cezasi","geldi","nedir","yapmalıyım","için","gibi","kanunu","kanun","sayılı","madde","hakkında","nasıl"];
      var w = q.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(function(s){ return s.length > 3 && BOS.indexOf(s) < 0 && !/^\d+$/.test(s); });
      if (w.length) {
        var t = r.map(function(x){ var hay = kat(x.yuk + " " + x.ihlal + " " + x.sonuc); return [w.filter(function(s){ return hay.indexOf(s) >= 0; }).length, x]; })
          .filter(function(p){ return p[0] > 0; }).sort(function(p, s){ return s[0] - p[0]; });
        if (t.length) r = t.map(function(p){ return p[1]; }); else if (!no) r = [];
      } else if (!no) r = [];
    }
    /* sohbet kaydı: rapor (en çok sorulan maddeler, cevaplanamayan sorular) ve talebe eklenen sohbet için */
    var hamSoru = $("#asistan-soru").value.trim();
    var kayit = { t: new Date().toISOString(), soru: hamSoru, kodlar: r.slice(0, 5).map(function(x){ return x.kod; }), cevap: r.length > 0, sayfa: location.pathname };
    var sl = depo.al("ipece-sohbet", []); sl.unshift(kayit); depo.koy("ipece-sohbet", sl.slice(0, 500));
    var ss = depo.al("ipece-son-sohbet", []); ss.push({ soru: hamSoru, yanit: r.length ? r.slice(0, 3).map(function(x){ return x.kod + " " + x.yuk + " (" + x.tutar + ")"; }).join("; ") : "Eşleşen kayıt yok" });
    depo.koy("ipece-son-sohbet", ss.slice(-6));
    if (!r.length) {
      c.innerHTML = "<strong>Bu konuda kayıtlı bilgimiz yok.</strong> Kanun ve madde numarasını yazarsanız (örneğin “4857/98”) ilgili yükümlülüğü gösteririz. Ya da numaranızı bırakın, uzmanımız sizi arasın.<div id=\"as-ga\" style=\"margin-top:1rem\"></div>";
      geriArama($("#as-ga", c), null);
      return;
    }
    /* tek madde bulunduysa: eksik veriyi (kişi/ay) sor, tahmini tutarı hesapla, eşik üstündeyse geri arama öner */
    if (r.length === 1) {
      var x = r[0];
      var kisi = (q.match(/(\d+)\s*(kişi|işçi|çalışan|personel|sigortalı)/) || [])[1];
      var ayS = (q.match(/(\d+)\s*ay\b/) || [])[1];
      c.innerHTML = "<strong>İlgili yükümlülük</strong><p style=\"margin-top:.4rem\"><a href=\"" + kok + "yukumlulukler/" + x.slug + "/\"><span class=\"kod\">" + esc(x.kod) + "</span> " + esc(x.yuk) + "</a>: " + esc(x.ihlal) + ". 2026 tutarı " +
        (x.dogru ? "<span class=\"tutar\">" + esc(x.tutar) + "</span>" : "<span class=\"dogrulanmadi\">" + esc(x.tutar) + "</span>") + ".</p>" +
        (x.bt ? "<div class=\"eksik\"><label>" + (x.birim === "işçi" ? "Kaç çalışan için?" : "Kaç kişi için?") + "<input id=\"as-adet\" type=\"number\" min=\"1\" inputmode=\"numeric\" value=\"" + (kisi || "") + "\"></label>" +
          (x.ay ? "<label>Kaç ay?<input id=\"as-ay\" type=\"number\" min=\"1\" inputmode=\"numeric\" value=\"" + (ayS || "1") + "\"></label>" : "") +
          "<p>Tahmini toplam: <output id=\"as-top\" class=\"tutar\">—</output></p></div>" : "") +
        "<div id=\"as-ga\"></div><span class=\"kucuk\">Kaynak: Balrium 2026 yaptırım envanteri. Bu yanıt genel bilgidir.</span>";
      var gaK = $("#as-ga", c);
      if (x.bt) {
        var aI = $("#as-adet", c), mI = $("#as-ay", c), oT = $("#as-top", c), son = null;
        var guncelle = function(){
          var a = parseInt(aI.value, 10) || 0, m = mI ? (parseInt(mI.value, 10) || 0) : 1;
          var top = a > 0 && m > 0 ? x.bt * a * m : null;
          oT.textContent = top != null ? tl(top) : "—";
          var u = top != null && top >= PARAM.esik;
          if (u !== son && !$(".ga-sonuc:not([hidden])", gaK)) { son = u; if (u) geriArama(gaK, x, top); else gaK.innerHTML = ""; }
        };
        aI.addEventListener("input", guncelle); if (mI) mI.addEventListener("input", guncelle); guncelle();
        if (!kisi) aI.focus();
      } else if (x.ust != null && x.ust >= PARAM.esik) {
        geriArama(gaK, x);
      }
      return;
    }
    var n = r.length; r = r.slice(0, 5);
    c.innerHTML = "<strong>" + (n > 1 ? "İlgili yükümlülükler" : "İlgili yükümlülük") + (n > 5 ? " (ilk 5 / " + n + ")" : "") + "</strong><ul>" +
      r.map(function(x){ return "<li><a href=\"" + kok + "yukumlulukler/" + x.slug + "/\"><span class=\"kod\">" + esc(x.kod) + "</span> " + esc(x.yuk) + "</a>: " + esc(x.ihlal) + ". 2026 tutarı " +
        (x.dogru ? "<span class=\"tutar\">" + esc(x.tutar) + "</span>" : "<span class=\"dogrulanmadi\">" + esc(x.tutar) + "</span>") + ".</li>"; }).join("") +
      "</ul><span class=\"kucuk\">Kaynak: Balrium 2026 yaptırım envanteri. Bu yanıt genel bilgidir; somut dosyanız için <a href=\"" + kok + "iletisim/\">bize yazın</a>.</span>";
  });

  /* ---------- F2 seçmeli panel: kurum türü → il (yazarak) → ilçe → kurum → kanun ---------- */
  var K = window.IPECE_K;
  var kl = $("#k-liste");
  if (kl && K && V) {
    var IL = ["Adana","Adıyaman","Afyonkarahisar","Ağrı","Aksaray","Amasya","Ankara","Antalya","Ardahan","Artvin","Aydın","Balıkesir","Bartın","Batman","Bayburt","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Düzce","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay","Iğdır","Isparta","İstanbul","İzmir","Kahramanmaraş","Karabük","Karaman","Kars","Kastamonu","Kayseri","Kilis","Kırıkkale","Kırklareli","Kırşehir","Kocaeli","Konya","Kütahya","Malatya","Manisa","Mardin","Mersin","Muğla","Muş","Nevşehir","Niğde","Ordu","Osmaniye","Rize","Sakarya","Samsun","Şanlıurfa","Siirt","Sinop","Sivas","Şırnak","Tekirdağ","Tokat","Trabzon","Tunceli","Uşak","Van","Yalova","Yozgat","Zonguldak"];
    var ilI = $("#k-il"), ilL = $("#k-il-liste"), ilceS = $("#k-ilce"), araI = $("#k-ara"), say = $("#k-say"), det = $("#k-detay");
    var il = "İstanbul", sec = -1;
    var ilceler = function(){
      var l = K.filter(function(k){ return k.il === il; }).map(function(k){ return k.ilce; });
      l = l.filter(function(v, i){ return l.indexOf(v) === i; }).sort(function(a, b){ return a.localeCompare(b, "tr"); });
      ilceS.innerHTML = "<option value=\"\">Tüm ilçeler</option>" + l.map(function(v){ return "<option>" + esc(v) + "</option>"; }).join("");
      ilceS.disabled = !l.length;
    };
    var ilSec = function(v){ il = v; ilI.value = v; ilL.hidden = true; ilI.setAttribute("aria-expanded", "false"); ilceler(); listele(); };
    var oner = function(){
      var q = kat(ilI.value.trim());
      var m = IL.filter(function(v){ return !q || kat(v).indexOf(q) === 0; }).slice(0, 8);
      sec = -1;
      ilL.innerHTML = m.map(function(v, i){ return "<li role=\"option\" id=\"il-o" + i + "\" data-v=\"" + esc(v) + "\">" + esc(v) + "</li>"; }).join("") || "<li class=\"yok\">Eşleşen il yok</li>";
      ilL.hidden = false; ilI.setAttribute("aria-expanded", "true");
    };
    ilI.addEventListener("input", oner);
    ilI.addEventListener("focus", function(){ ilI.select(); oner(); });
    ilI.addEventListener("keydown", function(ev){
      var o = ilL.querySelectorAll("[data-v]");
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") { ev.preventDefault(); sec = Math.max(0, Math.min(o.length - 1, sec + (ev.key === "ArrowDown" ? 1 : -1))); Array.prototype.forEach.call(o, function(e, i){ e.setAttribute("aria-selected", i === sec); }); if (o[sec]) ilI.setAttribute("aria-activedescendant", o[sec].id); }
      if (ev.key === "Enter") { ev.preventDefault(); var h = o[sec] || o[0]; if (h) ilSec(h.getAttribute("data-v")); }
      if (ev.key === "Escape") { ilL.hidden = true; }
    });
    ilL.addEventListener("mousedown", function(ev){ var t = ev.target.closest("[data-v]"); if (t) { ev.preventDefault(); ilSec(t.getAttribute("data-v")); } });
    ilI.addEventListener("blur", function(){ setTimeout(function(){ ilL.hidden = true; if (IL.indexOf(ilI.value) < 0) ilI.value = il; }, 150); });

    var listele = function(){
      det.hidden = true; kl.hidden = false;
      var ilce = ilceS.value, q = kat(araI.value.trim());
      var r = K.filter(function(k){ return k.il === il && (!ilce || k.ilce === ilce) && (!q || kat(k.ad).indexOf(q) >= 0); });
      if (!K.some(function(k){ return k.il === il; })) {
        say.textContent = "";
        kl.innerHTML = "<li class=\"bos\"><strong>" + esc(il) + " için kurum listesi henüz yüklenmedi.</strong><br>Yükümlülükler kurum türüne göre aynıdır: <a href=\"" + kok + "yukumlulukler/\">özel eğitim ve rehabilitasyon merkezlerinin yükümlülüklerini görün</a>.</li>";
        return;
      }
      say.textContent = r.length + " kurum" + (ilce ? " · " + ilce : "") + " · " + il;
      kl.innerHTML = r.slice(0, 60).map(function(k){ return "<li><a href=\"?k=" + k.s + "\" data-s=\"" + k.s + "\"><span class=\"ad\">" + esc(k.ad) + "</span><span class=\"yer\">" + esc(k.ilce) + " · " + esc(k.il) + "</span></a></li>"; }).join("") +
        (r.length > 60 ? "<li class=\"bos\">İlk 60 kurum gösteriliyor. İlçe seçin ya da kurum adını yazın.</li>" : "") +
        (!r.length ? "<li class=\"bos\">Bu aramayla eşleşen kurum yok.</li>" : "");
    };
    var goster = function(s){
      var k = K.filter(function(x){ return x.s === s; })[0]; if (!k) { listele(); return; }
      depo.koy("ipece-son-kurum", k.ad);
      var gr = {}; V.satir.forEach(function(x){ (gr[x.k] = gr[x.k] || []).push(x); });
      var kanunlar = Object.keys(gr).sort(function(a, b){ return gr[b].length - gr[a].length; });
      kl.hidden = true; say.textContent = "";
      det.hidden = false;
      det.innerHTML = "<p><a href=\"?\" class=\"geri\">Listeye dön</a></p>" +
        "<div class=\"kurum-kart\"><p class=\"ust-baslik\">Kurum</p><h2>" + esc(k.ad) + "</h2><dl><div><dt>İl</dt><dd>" + esc(k.il) + "</dd></div><div><dt>İlçe</dt><dd>" + esc(k.ilce) + "</dd></div><div><dt>Tür</dt><dd>Özel eğitim ve rehabilitasyon merkezi</dd></div></dl></div>" +
        "<div class=\"bolum-bas\" style=\"margin-top:2rem\"><div><h2>Bu kurumun tabi olduğu yükümlülükler</h2><p>" + V.satir.length + " yükümlülük, " + kanunlar.length + " kanun. Kanun seçerek daraltın.</p></div></div>" +
        "<label class=\"kanun-sec\" for=\"k-kanun\">Kanun<select id=\"k-kanun\"><option value=\"\">Tüm kanunlar</option>" + kanunlar.map(function(n){ return "<option value=\"" + n + "\">" + n + " · " + esc(V.kanun[n]) + " (" + gr[n].length + ")</option>"; }).join("") + "</select></label>" +
        "<div id=\"k-yuk\"></div><div id=\"k-ga\" style=\"margin-top:2rem\"></div>";
      var yukCiz = function(){
        var sec2 = $("#k-kanun", det).value;
        $("#k-yuk", det).innerHTML = kanunlar.filter(function(n){ return !sec2 || n === sec2; }).map(function(n){
          return "<h3 class=\"kanun-b\"><span class=\"kod\">" + n + "</span> " + esc(V.kanun[n]) + "</h3><ul class=\"yuk-liste\">" + gr[n].map(function(x){
            return "<li><a href=\"" + kok + "yukumlulukler/" + x.slug + "/\"><span class=\"kod\">" + esc(x.kod) + "</span><span class=\"ad\">" + esc(x.yuk) + "</span><span class=\"" + (x.dogru ? "tutar" : "dogrulanmadi") + "\">" + esc(x.tutar) + "</span></a></li>";
          }).join("") + "</ul>";
        }).join("");
      };
      $("#k-kanun", det).addEventListener("change", yukCiz); yukCiz();
      geriArama($("#k-ga", det), null);
      window.scrollTo(0, det.getBoundingClientRect().top + window.scrollY - 90);
    };
    kl.addEventListener("click", function(ev){ var a = ev.target.closest("a[data-s]"); if (a) { ev.preventDefault(); history.pushState(null, "", "?k=" + a.getAttribute("data-s")); goster(a.getAttribute("data-s")); } });
    det.addEventListener("click", function(ev){ var a = ev.target.closest("a.geri"); if (a) { ev.preventDefault(); history.pushState(null, "", location.pathname); listele(); } });
    window.addEventListener("popstate", function(){ var s = new URLSearchParams(location.search).get("k"); if (s) goster(s); else listele(); });
    ilceS.addEventListener("change", listele); araI.addEventListener("input", listele);
    ilceler();
    var ilkK = new URLSearchParams(location.search).get("k");
    if (ilkK) goster(ilkK); else listele();
  }

  /* iletişim: konu ön seçimi; form henüz bir adrese bağlı değil, bunu açıkça söyler */
  var fk = $("#f-konu");
  if (fk) {
    var k2 = new URLSearchParams(location.search).get("konu");
    if (k2) { for (var i = 0; i < fk.options.length; i++) if (fk.options[i].value === k2) fk.selectedIndex = i; }
    var sayfa = new URLSearchParams(location.search).get("sayfa");
    if (sayfa) $("#f-mesaj").value = "Sayfa: " + sayfa + "\n\n";
    $("#iletisim-form").addEventListener("submit", function(e){ e.preventDefault(); $("#f-durum").hidden = false; });
  }
})();
