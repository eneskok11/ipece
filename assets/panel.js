/* ipece yönetim paneli önizlemesi. Veriler yalnız bu tarayıcıda (localStorage) tutulur; sunucuya hiçbir şey gönderilmez. */
(function(){
  "use strict";
  var $ = function(s, k){ return (k||document).querySelector(s); };
  var $$ = function(s, k){ return Array.prototype.slice.call((k||document).querySelectorAll(s)); };
  var esc = function(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]; }); };
  var kat = function(s){ return String(s || "").toLocaleLowerCase("tr"); };
  var tl = function(n){ return n == null || isNaN(n) ? "—" : Number(n).toLocaleString("tr-TR", {maximumFractionDigits: 2}) + " TL"; };
  var depo = {
    al: function(a, v){ try { var x = localStorage.getItem(a); return x === null ? v : JSON.parse(x); } catch (_) { return v; } },
    koy: function(a, v){ try { localStorage.setItem(a, JSON.stringify(v)); return true; } catch (_) { return false; } },
    sil: function(a){ try { localStorage.removeItem(a); } catch (_) {} }
  };
  var V = window.IPECE, K = window.IPECE_K, P = window.IPECE_PARAM;
  if (!V || !K || !$("#p-ozet")) return;
  var kok = document.documentElement.getAttribute("data-kok") || "";

  /* sekmeler */
  var sekmeler = $$('[role="tab"]');
  var ac = function(t){
    sekmeler.forEach(function(b){ var s = b === t; b.setAttribute("aria-selected", s); b.tabIndex = s ? 0 : -1; $("#" + b.getAttribute("aria-controls")).hidden = !s; });
    ciz[t.id]();
    try { history.replaceState(null, "", "#" + t.id.slice(2)); } catch (_) {}
  };
  sekmeler.forEach(function(b, i){
    b.addEventListener("click", function(){ ac(b); });
    b.addEventListener("keydown", function(ev){
      var j = ev.key === "ArrowRight" ? i + 1 : ev.key === "ArrowLeft" ? i - 1 : null;
      if (j !== null) { ev.preventDefault(); var n = sekmeler[(j + sekmeler.length) % sekmeler.length]; n.focus(); ac(n); }
    });
  });

  var DURUM = ["Yeni", "Arandı", "Hizmet açıldı", "Kapandı"];
  var talepler = function(){ return depo.al("ipece-talepler", []); };
  var talepSay = function(){ var n = talepler().filter(function(t){ return t.durum === "Yeni"; }).length; $("#talep-say").textContent = n ? "(" + n + " yeni)" : ""; };

  var ciz = {};

  /* ---------- Özet: yol haritası durumu + ölçüler ---------- */
  ciz["t-ozet"] = function(){
    var t = talepler();
    var esik = t.filter(function(x){ return x.esikUstu; }).length;
    var hizmet = t.filter(function(x){ return x.durum === "Hizmet açıldı" || (x.durum === "Kapandı" && x.bedel); }).length;
    var bedel = t.reduce(function(a, x){ return a + (parseFloat(x.bedel) || 0); }, 0);
    var F = [
      ["F0", "Netleştirme", "acik", "Ürün adı ve alan adı netleşti (ipece.org). Açık: gelir payı oranı, reklam yasağı onayı, aydınlatma metni, geri arama kanalı."],
      ["F1", "Yükümlülük defteri ve tutar motoru", "onizleme", V.satir.length + " yükümlülük, 9 kanun. 5510 tutarları katsayı × asgari ücret; parametre değişince yeniden hesaplanır. Balrium editörü ve sürüm geçmişi sırada."],
      ["F2", "Herkese açık site", "onizleme", "Kurum türü → il (yazarak) → ilçe → kurum → kanun. " + K.length + " İstanbul kurumu; ziyaretçi yalnız ad, il, ilçe ve tür görür. Yükümlülük künyeleri ve makale sayfası."],
      ["F3", "Asistan ve geri arama", "onizleme", "Asistan yalnız defterden cevap verir, kişi sayısını sorar, tahmini tutarı hesaplar. Eşik (" + tl(P.esik) + ") üstünde telefon alınır. Balrium'a anlık bildirim bağlı değil."],
      ["F4", "Yönetim paneli", "onizleme", "Talep kutusu, kurum veritabanı, Excel ile eşleştirme, tutar parametreleri. Bu önizlemede veriler yalnız bu tarayıcıda."],
      ["F5", "Yayın: İstanbul ÖERM", "sirada", "Tüm makaleler, arama motoru kaydı, haftalık ölçü."],
      ["F6", "Genişleme", "sirada", "81 il ve diğer kurum türleri deftere satır olarak; kurum paneli."]
    ];
    var ad = { acik: "Açık karar var", onizleme: "Önizlemede", sirada: "Sırada" };
    $("#p-ozet").innerHTML =
      "<div class=\"olcu\"><div><b>" + t.length + "</b>talep</div><div><b>" + esik + "</b>eşik üstü</div><div><b>" + hizmet + "</b>hizmete dönen</div><div><b>" + tl(bedel) + "</b>açılan hizmet bedeli</div></div>" +
      "<p class=\"kucuk\" style=\"margin:.6rem 0 1.6rem\">Gelir payı bu zincirden ölçülür: talep → geri arama → açılan hizmet → bedel.</p>" +
      "<h2 class=\"pb\">Yol haritası</h2><ol class=\"faz\">" + F.map(function(f){
        return "<li><span class=\"faz-no\">" + f[0] + "</span><div><h3>" + esc(f[1]) + " <span class=\"cip " + f[2] + "\">" + ad[f[2]] + "</span></h3><p>" + esc(f[3]) + "</p></div></li>";
      }).join("") + "</ol>";
  };

  /* ---------- Talepler ---------- */
  ciz["t-talep"] = function(){
    var t = talepler();
    var p = $("#p-talep");
    if (!t.length) {
      p.innerHTML = "<div class=\"bos-durum\"><h2 class=\"pb\">Henüz talep yok</h2><p>Sitede bir yükümlülük künyesinde, asistanda ya da kurum sayfasında “Beni arayın” formu doldurulduğunda talep buraya düşer.</p><p><a class=\"dugme ikincil\" href=\"" + kok + "yukumlulukler/4857-98-muvazaali-alt-isverenlik/\">Bir künyede deneyin</a></p></div>";
      return;
    }
    p.innerHTML = "<div class=\"tablo-kap\"><table class=\"panel-tablo\"><thead><tr><th>Talep</th><th>Kişi</th><th>Konu</th><th>Tahmini tutar</th><th>Durum</th><th>Açılan hizmet</th><th>Bedel (TL)</th></tr></thead><tbody>" +
      t.map(function(x, i){
        return "<tr data-i=\"" + i + "\"><td><span class=\"kod\">" + esc(x.id) + "</span><br><span class=\"kucuk\">" + new Date(x.tarih).toLocaleString("tr-TR", {dateStyle: "short", timeStyle: "short"}) + "</span></td>" +
          "<td>" + esc(x.ad) + "<br><span class=\"kucuk\">" + esc(x.tel) + (x.kurum ? " · " + esc(x.kurum) : "") + "</span></td>" +
          "<td>" + (x.kod ? "<span class=\"kod\">" + esc(x.kod) + "</span><br>" + esc(x.yuk) : "<span class=\"kucuk\">Genel</span>") + "</td>" +
          "<td class=\"" + (x.esikUstu ? "tutar" : "") + "\">" + tl(x.tahmin) + (x.esikUstu ? "<br><span class=\"cip acik\">Eşik üstü</span>" : "") + "</td>" +
          "<td><select data-a=\"durum\" aria-label=\"Durum\">" + DURUM.map(function(d){ return "<option" + (d === x.durum ? " selected" : "") + ">" + d + "</option>"; }).join("") + "</select></td>" +
          "<td><input data-a=\"hizmet\" value=\"" + esc(x.hizmet) + "\" placeholder=\"Örn. itiraz dilekçesi\" aria-label=\"Açılan hizmet\"></td>" +
          "<td><input data-a=\"bedel\" type=\"number\" min=\"0\" inputmode=\"decimal\" value=\"" + esc(x.bedel) + "\" aria-label=\"Bedel\"></td></tr>";
      }).join("") + "</tbody></table></div>" +
      "<p style=\"margin-top:1rem\"><button class=\"dugme ikincil\" type=\"button\" id=\"talep-temizle\">Bu tarayıcıdaki talepleri sil</button></p>";
    p.addEventListener("change", kaydet);
    $("#talep-temizle").addEventListener("click", function(){
      var b = this;
      if (b.dataset.onay) { depo.sil("ipece-talepler"); talepSay(); ciz["t-talep"](); return; }
      b.dataset.onay = "1"; b.textContent = "Silmeyi onaylayın: " + t.length + " talep silinecek";
    });
  };
  var kaydet = function(ev){
    var tr = ev.target.closest("tr[data-i]"); if (!tr) return;
    var t = talepler(), x = t[+tr.getAttribute("data-i")]; if (!x) return;
    x[ev.target.getAttribute("data-a")] = ev.target.value;
    depo.koy("ipece-talepler", t); talepSay();
  };

  /* ---------- Kurum veritabanı ---------- */
  var ek = function(){ return depo.al("ipece-ek", {}); };
  var ekKolon = function(){ return depo.al("ipece-ek-kolon", []); };
  ciz["t-kurum"] = function(){
    var p = $("#p-kurum");
    var ilceler = K.map(function(k){ return k.ilce; }).filter(function(v, i, a){ return a.indexOf(v) === i; }).sort(function(a, b){ return a.localeCompare(b, "tr"); });
    p.innerHTML = "<div class=\"suzgec\" style=\"border-top:0\"><label for=\"pk-ara\">Kurum adı<input id=\"pk-ara\" type=\"search\" autocomplete=\"off\"></label>" +
      "<label for=\"pk-ilce\">İlçe<select id=\"pk-ilce\"><option value=\"\">Tüm ilçeler</option>" + ilceler.map(function(v){ return "<option>" + esc(v) + "</option>"; }).join("") + "</select></label></div>" +
      "<p class=\"kucuk\" id=\"pk-say\"></p><div class=\"tablo-kap\"><table class=\"panel-tablo\" id=\"pk-tablo\"></table></div>" +
      "<p class=\"not-kutusu\" style=\"margin-top:1.2rem\">Telefon ve sorumlu adı gibi alanlar herkese açık sitede hiçbir zaman görünmez. Bu önizlemede bu alanlar <a href=\"#excel\" data-git=\"t-excel\">Excel ile eşleştir</a> bölümünden, kendi dosyanızdan eklenir ve yalnız bu tarayıcıda kalır.</p>";
    var c = function(){
      var q = kat($("#pk-ara").value.trim()), il = $("#pk-ilce").value, E = ek(), EK = ekKolon();
      var r = K.filter(function(k){ return (!il || k.ilce === il) && (!q || kat(k.ad).indexOf(q) >= 0); });
      $("#pk-say").textContent = r.length + " kurum" + (EK.length ? " · eklenen kolonlar: " + EK.join(", ") : "");
      $("#pk-tablo").innerHTML = "<thead><tr><th>Kurum</th><th>İlçe</th>" + EK.map(function(k){ return "<th>" + esc(k) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        r.slice(0, 200).map(function(k){ return "<tr><td>" + esc(k.ad) + "</td><td>" + esc(k.ilce) + "</td>" + EK.map(function(c2){ return "<td>" + esc((E[k.s] || {})[c2]) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody>";
    };
    $("#pk-ara").addEventListener("input", c); $("#pk-ilce").addEventListener("change", c); c();
  };

  /* ---------- Excel ile eşleştir: önce önizleme, onaydan sonra yazar ---------- */
  var norm = function(s){
    return kat(s).replace(/özel eğitim ve rehabilitasyon merkezi/g, " ").replace(/\bözel\b/g, " ").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  };
  var IDX = null;
  var indeks = function(){ if (!IDX) { IDX = {}; K.forEach(function(k){ IDX[norm(k.ad)] = k; }); } return IDX; };

  /* xlsx okuyucu: zip merkezi dizini + DecompressionStream ile; dış kütüphane yok */
  var zipAc = async function(buf){
    var dv = new DataView(buf), i = buf.byteLength - 22;
    while (i >= 0 && dv.getUint32(i, true) !== 0x06054b50) i--;
    if (i < 0) throw new Error("zip değil");
    var n = dv.getUint16(i + 10, true), off = dv.getUint32(i + 16, true), dosya = {}, dec = new TextDecoder();
    for (var j = 0; j < n; j++) {
      var yt = dv.getUint16(off + 10, true), boy = dv.getUint32(off + 20, true), al = dv.getUint16(off + 28, true), ex = dv.getUint16(off + 30, true), yo = dv.getUint16(off + 32, true), lh = dv.getUint32(off + 42, true);
      var ad = dec.decode(new Uint8Array(buf, off + 46, al));
      dosya[ad] = { yt: yt, boy: boy, lh: lh };
      off += 46 + al + ex + yo;
    }
    var oku = async function(ad){
      var f = dosya[ad]; if (!f) return null;
      var la = dv.getUint16(f.lh + 26, true), le = dv.getUint16(f.lh + 28, true);
      var veri = new Uint8Array(buf, f.lh + 30 + la + le, f.boy);
      if (f.yt === 0) return dec.decode(veri);
      var ds = new Blob([veri]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      return await new Response(ds).text();
    };
    return { dosya: dosya, oku: oku };
  };
  var xlsxOku = async function(buf){
    var z = await zipAc(buf);
    var xml = function(t){ return new DOMParser().parseFromString(t, "application/xml"); };
    var ss = [];
    var sst = await z.oku("xl/sharedStrings.xml");
    if (sst) $$("si", xml(sst)).forEach(function(si){ ss.push($$("t", si).map(function(t){ return t.textContent; }).join("")); });
    var yol = Object.keys(z.dosya).filter(function(a){ return /^xl\/worksheets\/sheet\d+\.xml$/.test(a); }).sort()[0];
    if (!yol) throw new Error("sayfa yok");
    var doc = xml(await z.oku(yol));
    var kol = function(r){ var m = r.match(/^[A-Z]+/)[0], n = 0; for (var i = 0; i < m.length; i++) n = n * 26 + m.charCodeAt(i) - 64; return n - 1; };
    return $$("sheetData > row", doc).map(function(row){
      var a = [];
      $$("c", row).forEach(function(c){
        var t = c.getAttribute("t"), v = c.querySelector("v"), d = "";
        if (t === "s" && v) d = ss[+v.textContent] || ""; else if (t === "inlineStr") d = $$("t", c).map(function(x){ return x.textContent; }).join(""); else if (v) d = v.textContent;
        a[kol(c.getAttribute("r"))] = d;
      });
      for (var i = 0; i < a.length; i++) if (a[i] === undefined) a[i] = "";
      return a;
    });
  };
  var csvOku = function(t){
    var ayr = (t.split("\n")[0].match(/;/g) || []).length > (t.split("\n")[0].match(/,/g) || []).length ? ";" : ",";
    return t.split(/\r?\n/).filter(function(l){ return l.trim(); }).map(function(l){ return l.split(ayr).map(function(h){ return h.replace(/^"|"$/g, "").trim(); }); });
  };

  var tablo = null;
  ciz["t-excel"] = function(){
    var p = $("#p-excel");
    if (p.dataset.hazir) return;
    p.dataset.hazir = "1";
    p.innerHTML = "<div class=\"excel-adim\"><h2 class=\"pb\">1. Dosyayı seçin</h2><p class=\"kucuk\">Excel (.xlsx) ya da CSV. Dosya bu bilgisayardan çıkmaz; tarayıcıda okunur.</p>" +
      "<label class=\"dosya\"><input id=\"x-dosya\" type=\"file\" accept=\".xlsx,.csv\"><span>Dosya seçin</span></label><p id=\"x-bilgi\" class=\"kucuk\"></p></div>" +
      "<div class=\"excel-adim\" id=\"x-ayar\" hidden><h2 class=\"pb\">2. Ne yapılacağını seçin</h2>" +
      "<div class=\"alanlar\"><label for=\"x-ad\">Kurum adının olduğu kolon<select id=\"x-ad\"></select></label>" +
      "<label for=\"x-ekle\">Kurumlara eklenecek kolon<select id=\"x-ekle\"></select></label>" +
      "<label for=\"x-baslik\">Panelde görünecek ad<input id=\"x-baslik\" placeholder=\"Örn. Telefon\"></label></div>" +
      "<label class=\"kutu\" style=\"margin-top:.6rem\"><input type=\"checkbox\" id=\"x-ilk\" checked> İlk satır başlık</label>" +
      "<p style=\"margin-top:1rem\"><button class=\"dugme\" type=\"button\" id=\"x-onizle\">Eşleşmeyi önizleyin</button></p></div>" +
      "<div class=\"excel-adim\" id=\"x-sonuc\" hidden></div>";
    var dosya = $("#x-dosya");
    dosya.addEventListener("change", async function(){
      var f = dosya.files[0]; if (!f) return;
      $("#x-bilgi").textContent = "Okunuyor…";
      try {
        tablo = /\.csv$/i.test(f.name) ? csvOku(await f.text()) : await xlsxOku(await f.arrayBuffer());
      } catch (err) {
        $("#x-bilgi").textContent = "Dosya okunamadı. Excel (.xlsx) ya da CSV olduğundan emin olun."; $("#x-ayar").hidden = true; return;
      }
      var gen = tablo.reduce(function(a, r){ return Math.max(a, r.length); }, 0);
      $("#x-bilgi").textContent = f.name + ": " + tablo.length + " satır, " + gen + " kolon.";
      var ilkSatir = tablo[0] || [];
      var opt = function(){ var s = ""; for (var i = 0; i < gen; i++) { var o = tablo.slice(0, 3).map(function(r){ return r[i] || ""; }).join(" · "); s += "<option value=\"" + i + "\">Kolon " + String.fromCharCode(65 + i) + ": " + esc(o.slice(0, 60)) + "</option>"; } return s; };
      $("#x-ad").innerHTML = opt(); $("#x-ekle").innerHTML = opt();
      /* tahmin: kurum adına en çok benzeyen kolon */
      var enIyi = 0, skor = -1;
      for (var i = 0; i < gen; i++) { var s2 = tablo.slice(0, 40).filter(function(r){ return indeks()[norm(r[i])]; }).length; if (s2 > skor) { skor = s2; enIyi = i; } }
      $("#x-ad").value = enIyi; $("#x-ekle").value = gen > enIyi + 1 ? gen - 1 : 0;
      $("#x-ilk").checked = !indeks()[norm(ilkSatir[enIyi])];
      $("#x-ayar").hidden = false; $("#x-sonuc").hidden = true;
    });
    $("#x-onizle").addEventListener("click", function(){
      var ai = +$("#x-ad").value, ei = +$("#x-ekle").value;
      var bas = $("#x-ilk").checked ? tablo[0] : null;
      var baslik = $("#x-baslik").value.trim() || (bas && bas[ei]) || ("Kolon " + String.fromCharCode(65 + ei));
      var satirlar = $("#x-ilk").checked ? tablo.slice(1) : tablo;
      var es = [], yok = [];
      satirlar.forEach(function(r){ var k = indeks()[norm(r[ai])]; if (k) es.push([k, r[ei] || ""]); else if (String(r[ai] || "").trim()) yok.push(r[ai]); });
      var s = $("#x-sonuc"); s.hidden = false;
      s.innerHTML = "<h2 class=\"pb\">3. Önizleme</h2><div class=\"olcu\"><div><b>" + es.length + "</b>eşleşen</div><div><b>" + yok.length + "</b>eşleşmeyen</div><div><b>" + esc(baslik) + "</b>eklenecek kolon</div></div>" +
        "<div class=\"iki\" style=\"margin-top:1.2rem;gap:2rem\"><div><h3>Eşleşenlerden örnek</h3><div class=\"tablo-kap\"><table class=\"panel-tablo\"><thead><tr><th>Kurum</th><th>" + esc(baslik) + "</th></tr></thead><tbody>" +
        es.slice(0, 8).map(function(x){ return "<tr><td>" + esc(x[0].ad) + "</td><td>" + esc(x[1]) + "</td></tr>"; }).join("") + "</tbody></table></div></div>" +
        "<div><h3>Eşleşmeyenler</h3>" + (yok.length ? "<ul class=\"yok-liste\">" + yok.slice(0, 30).map(function(v){ return "<li>" + esc(v) + "</li>"; }).join("") + "</ul>" + (yok.length > 30 ? "<p class=\"kucuk\">ve " + (yok.length - 30) + " satır daha</p>" : "") : "<p class=\"kucuk\">Hepsi eşleşti.</p>") + "</div></div>" +
        "<p style=\"margin-top:1.2rem;display:flex;gap:.6rem;flex-wrap:wrap\"><button class=\"dugme\" type=\"button\" id=\"x-onay\"" + (es.length ? "" : " disabled") + ">Onaylayın ve " + es.length + " kuruma ekleyin</button></p><p id=\"x-yazildi\" class=\"kucuk\" role=\"status\"></p>";
      $("#x-onay").addEventListener("click", function(){
        var E = ek(), EK = ekKolon();
        es.forEach(function(x){ (E[x[0].s] = E[x[0].s] || {})[baslik] = x[1]; });
        if (EK.indexOf(baslik) < 0) EK.push(baslik);
        var ok = depo.koy("ipece-ek", E) && depo.koy("ipece-ek-kolon", EK);
        $("#x-yazildi").innerHTML = ok ? "<strong>" + es.length + " kuruma “" + esc(baslik) + "” eklendi.</strong> <a href=\"#kurum\" data-git=\"t-kurum\">Kurum veritabanında görün</a>" : "Yazılamadı: tarayıcı yerel kaydı engelliyor.";
        this.disabled = true;
      });
    });
  };

  /* ---------- Tutar parametreleri (F1) ---------- */
  ciz["t-param"] = function(){
    var p = $("#p-param");
    var kayit = depo.al("ipece-param", {});
    var au = kayit.au || V.au, es = kayit.esik || V.esik;
    var b5510 = V.satir.filter(function(x){ return x.kat; });
    p.innerHTML = "<div class=\"iki\" style=\"gap:2.5rem\"><div><h2 class=\"pb\">Parametreler</h2>" +
      "<div class=\"form\" style=\"max-width:none\"><label for=\"pa-au\">Aylık brüt asgari ücret (TL)<input id=\"pa-au\" type=\"number\" min=\"1\" step=\"0.01\" inputmode=\"decimal\" value=\"" + au + "\"></label>" +
      "<p class=\"kucuk\">2026 değeri " + tl(V.au) + ": Balrium listesindeki 5510 tutarlarının hepsi bu tutarın tam katı.</p>" +
      "<label for=\"pa-esik\">Geri arama eşiği (TL)<input id=\"pa-esik\" type=\"number\" min=\"1\" inputmode=\"numeric\" value=\"" + es + "\"></label>" +
      "<p class=\"kucuk\">Tahmini tutar ya da tutar aralığının üst ucu bu eşiği aşarsa ziyaretçiden telefon istenir.</p>" +
      "<p style=\"display:flex;gap:.6rem;flex-wrap:wrap\"><button class=\"dugme\" type=\"button\" id=\"pa-uygula\">Uygulayın</button><button class=\"dugme ikincil\" type=\"button\" id=\"pa-sifir\">2026 değerlerine dönün</button></p><p id=\"pa-durum\" class=\"kucuk\" role=\"status\"></p></div></div>" +
      "<div><h2 class=\"pb\">Etkilenen yükümlülükler</h2><p class=\"kucuk\">Asgari ücrete bağlı " + b5510.length + " satır. Uygulayınca sitedeki künyeler, liste ve hesaplayıcı bu tarayıcıda yeni tutarla görünür.</p>" +
      "<div class=\"tablo-kap\"><table class=\"panel-tablo\"><thead><tr><th>Madde</th><th>Kural</th><th>Şu an</th><th>Yeni</th></tr></thead><tbody id=\"pa-tablo\"></tbody></table></div></div></div>";
    var kesir = function(k){ return ({0.125: "1/8", 0.2: "1/5", 0.5: "1/2"})[k] || String(k).replace(".", ","); };
    var bicim = function(x, a){ var t = x.tpl.replace(/\{(\d+)\}/g, function(_, i){ return (Math.round(x.kat[+i] * a * 100) / 100).toLocaleString("tr-TR", {maximumFractionDigits: 2}); }); return /^[\d.,\s\/–]+$/.test(t) ? t + " TL" : t.replace(" /", " TL /"); };
    var on = function(){
      var a = parseFloat($("#pa-au").value) || 0;
      $("#pa-tablo").innerHTML = b5510.map(function(x){ var y = bicim(x, a); var eski = bicim(x, P.au); return "<tr><td><a href=\"" + kok + "yukumlulukler/" + x.slug + "/\"><span class=\"kod\">" + esc(x.kod) + "</span></a><br>" + esc(x.yuk) + "</td><td>" + x.kat.map(kesir).join(" / ") + " × AÜ</td><td>" + esc(eski) + "</td><td class=\"" + (y !== eski ? "tutar" : "") + "\">" + esc(y) + "</td></tr>"; }).join("");
    };
    $("#pa-au").addEventListener("input", on); on();
    $("#pa-uygula").addEventListener("click", function(){
      var a = parseFloat($("#pa-au").value), e = parseFloat($("#pa-esik").value);
      if (!(a > 0) || !(e > 0)) { $("#pa-durum").textContent = "Asgari ücret ve eşik sıfırdan büyük olmalı."; return; }
      var ok = depo.koy("ipece-param", { au: a, esik: e });
      $("#pa-durum").innerHTML = ok ? "Uygulandı. <a href=\"" + kok + "yukumlulukler/" + b5510[0].slug + "/\">Bir künyede görün</a>" : "Kaydedilemedi: tarayıcı yerel kaydı engelliyor.";
    });
    $("#pa-sifir").addEventListener("click", function(){ depo.sil("ipece-param"); $("#pa-au").value = V.au; $("#pa-esik").value = V.esik; on(); $("#pa-durum").textContent = "2026 değerlerine dönüldü."; });
  };

  document.addEventListener("click", function(ev){ var a = ev.target.closest("[data-git]"); if (a) { ev.preventDefault(); var t = $("#" + a.getAttribute("data-git")); t.focus(); ac(t); } });
  talepSay();
  var hashAc = function(){ var h = location.hash.slice(1), t = h && $("#t-" + h); if (t && t.getAttribute("aria-selected") !== "true") ac(t); };
  window.addEventListener("hashchange", hashAc);
  var h0 = location.hash.slice(1), ilk = h0 && $("#t-" + h0);
  ac(ilk || sekmeler[0]);
})();
