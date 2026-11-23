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
      ["F0", "Netleştirme", "acik", "Ad ve alan adı netleşti: ipece.org. Açık: gelir payı oranı, reklam yasağı onayı, aydınlatma metni, talebin düşeceği kanal (WhatsApp, SMS, e-posta)."],
      ["F1", "Yaptırım defteri ve tutar motoru", "onizleme", V.satir.length + " yükümlülük, 9 kanun. Tutar kuralları: sabit, katsayı, kişi/ay başı, aralık, formül, doğrulanmadı. 5510 tutarları asgari ücretten hesaplanır. Defterde Balrium onayı ve satır düzeltme var."],
      ["F2", "Herkese açık site", "onizleme", "Kurum türü → il (yazarak) → ilçe → kurum → kanun. " + K.length + " İstanbul kurumu; ziyaretçi yalnız ad, il, ilçe ve tür görür. Makale editörü: başlık, meta ve arama önizlemesi, uzunluk denetimi, sürüm geçmişi."],
      ["F3", "Asistan ve geri arama", "onizleme", "Ana sayfada soru kutusu. Asistan yalnız defterden cevap verir, kişi ve ay sayısını sorar, tahmini tutarı hesaplar; bilmediği soruda geri arama önerir. Eşik (" + tl(P.esik) + ") üstünde telefon alınır. Balrium'a anlık bildirim sunucu kurulunca açılacak."],
      ["F4", "Yönetim paneli", "onizleme", "Talep ekranı (sohbet, telefon, kurum kaydı, arandı saati, hizmet, bedel), açık talepli kurum işareti, cümleyle Excel eşleme ve şüpheli eşleşmeler, rapor."],
      ["F5", "Yayın: İstanbul ÖERM", "sirada", "68 makalenin yazımı (Balrium), arama motoru kaydı, haftalık ölçü."],
      ["F6", "Genişleme", "sirada", "81 il ve diğer kurum türleri deftere satır olarak; kurum paneli (öz-değerlendirme, risk haritası, sorumlu atama)."]
    ];
    var ad = { acik: "Açık karar var", onizleme: "Önizlemede", sirada: "Sırada" };
    $("#p-ozet").innerHTML =
      "<div class=\"olcu\"><div><b>" + t.length + "</b>talep</div><div><b>" + esik + "</b>eşik üstü</div><div><b>" + hizmet + "</b>hizmete dönen</div><div><b>" + tl(bedel) + "</b>açılan hizmet bedeli</div></div>" +
      "<p class=\"kucuk\" style=\"margin:.6rem 0 1.6rem\">Gelir payı bu zincirden ölçülür: talep → geri arama → açılan hizmet → bedel.</p>" +
      "<h2 class=\"pb\">Yol haritası</h2><ol class=\"faz\">" + F.map(function(f){
        return "<li><span class=\"faz-no\">" + f[0] + "</span><div><h3>" + esc(f[1]) + " <span class=\"cip " + f[2] + "\">" + ad[f[2]] + "</span></h3><p>" + esc(f[3]) + "</p></div></li>";
      }).join("") + "</ol>";
  };

  /* ---------- Talepler (09) ve talep ekranı (10) ---------- */
  var acikTalep = null;
  ciz["t-talep"] = function(){
    var t = talepler();
    var p = $("#p-talep");
    if (!t.length) {
      p.innerHTML = "<div class=\"bos-durum\"><h2 class=\"pb\">Henüz talep yok</h2><p>Sitede bir yükümlülük künyesinde, asistanda ya da kurum sayfasında “Beni arayın” formu doldurulduğunda talep buraya düşer.</p><p><a class=\"dugme ikincil\" href=\"" + kok + "yukumlulukler/4857-98-muvazaali-alt-isverenlik/\">Bir künyede deneyin</a></p></div>";
      return;
    }
    if (acikTalep !== null && t[acikTalep]) { talepEkrani(acikTalep); return; }
    p.innerHTML = "<p class=\"kucuk\" style=\"margin-bottom:.8rem\">En yeni talep üstte. Talebi açmak için numarasına tıklayın.</p><div class=\"tablo-kap\"><table class=\"panel-tablo\"><thead><tr><th>Talep</th><th>Kurum ve kişi</th><th>Konu</th><th>Tahmini tutar</th><th>Durum</th><th>Bildirim</th></tr></thead><tbody>" +
      t.map(function(x, i){
        return "<tr><td><button type=\"button\" class=\"bag\" data-ac=\"" + i + "\"><span class=\"kod\">" + esc(x.id) + "</span></button><br><span class=\"kucuk\">" + new Date(x.tarih).toLocaleString("tr-TR", {dateStyle: "short", timeStyle: "short"}) + "</span></td>" +
          "<td>" + (x.kurum ? esc(x.kurum) + "<br>" : "") + "<span class=\"kucuk\">" + esc(x.ad) + " · " + esc(x.tel) + "</span></td>" +
          "<td>" + (x.kod ? "<span class=\"kod\">" + esc(x.kod) + "</span><br>" + esc(x.yuk) : "<span class=\"kucuk\">Genel soru</span>") + "</td>" +
          "<td class=\"" + (x.esikUstu ? "tutar" : "") + "\">" + tl(x.tahmin) + (x.esikUstu ? "<br><span class=\"cip acik\">Eşik üstü</span>" : "") + "</td>" +
          "<td><span class=\"cip " + (x.durum === "Yeni" ? "acik" : x.durum === "Kapandı" ? "sirada" : "onizleme") + "\">" + esc(x.durum) + "</span>" + (x.arandi ? "<br><span class=\"kucuk\">Arandı " + new Date(x.arandi).toLocaleTimeString("tr-TR", {hour: "2-digit", minute: "2-digit"}) + "</span>" : "") + "</td>" +
          "<td><span class=\"kucuk\">Bağlı değil</span></td></tr>";
      }).join("") + "</tbody></table></div>" +
      "<p class=\"kucuk\" style=\"margin-top:.8rem\">Bildirim: eşik üstü talebin Balrium'un telefonuna WhatsApp ile anında gitmesi sunucu kurulunca açılacak. Hiçbir talep “gönderildi” diye gösterilmez.</p>" +
      "<p style=\"margin-top:1rem\"><button class=\"dugme ikincil\" type=\"button\" id=\"talep-temizle\">Bu tarayıcıdaki talepleri sil</button></p>";
    $("#talep-temizle").addEventListener("click", function(){
      var b = this;
      if (b.dataset.onay) { depo.sil("ipece-talepler"); talepSay(); ciz["t-talep"](); return; }
      b.dataset.onay = "1"; b.textContent = "Silmeyi onaylayın: " + t.length + " talep silinecek";
    });
  };
  var kurumBul = function(ad){ var n = norm(ad); return n ? (indeks()[n] || null) : null; };
  var talepEkrani = function(i){
    acikTalep = i;
    var t = talepler(), x = t[i], p = $("#p-talep");
    var k = kurumBul(x.kurum), E = ek(), EK = ekKolon(), kek = k ? (E[k.s] || {}) : {};
    var sohbet = x.sohbet || [];
    p.innerHTML = "<p><button type=\"button\" class=\"bag\" id=\"t-geri\">Tüm talepler</button></p>" +
      "<div class=\"talep-bas\"><div><p class=\"ust-baslik\">Talep " + esc(x.id) + " · " + new Date(x.tarih).toLocaleString("tr-TR", {dateStyle: "medium", timeStyle: "short"}) + "</p><h2>" + esc(x.kurum || x.ad) + "</h2></div>" +
        "<div class=\"talep-tutar\"><span class=\"kucuk\">Tahmini tutar</span><b class=\"" + (x.esikUstu ? "tutar" : "") + "\">" + tl(x.tahmin) + "</b></div></div>" +
      "<div class=\"talep-izgara\">" +
        "<section><h3>Aranacak kişi</h3><dl class=\"kv\"><div><dt>Ad</dt><dd>" + esc(x.ad) + "</dd></div><div><dt>Telefon</dt><dd><b>" + esc(x.tel) + "</b></dd></div>" +
          "<div><dt>Konu</dt><dd>" + (x.kod ? "<a href=\"" + kok + "yukumlulukler/" + esc(x.slug) + "/\"><span class=\"kod\">" + esc(x.kod) + "</span> " + esc(x.yuk) + "</a>" : "Genel soru") + "</dd></div>" +
          "<div><dt>Geldiği sayfa</dt><dd class=\"kucuk\">" + esc(x.sayfa) + "</dd></div></dl></section>" +
        "<section><h3>Kurum kaydı</h3>" + (k ? "<dl class=\"kv\"><div><dt>Kurum</dt><dd>" + esc(k.ad) + "</dd></div><div><dt>İl / ilçe</dt><dd>" + esc(k.il) + " / " + esc(k.ilce) + "</dd></div>" +
          (EK.length ? EK.map(function(c){ return "<div><dt>" + esc(c) + "</dt><dd>" + (esc(kek[c]) || "<span class=\"kucuk\">—</span>") + "</dd></div>"; }).join("") : "<div><dt>Telefon, sorumlu</dt><dd class=\"kucuk\">Excel ile eşleştir bölümünden eklenir</dd></div>") + "</dl>"
          : "<p class=\"kucuk\">Kurum adı kayıtlı kurumlarla eşleşmedi" + (x.kurum ? ": “" + esc(x.kurum) + "”" : "") + ".</p>") + "</section>" +
        "<section class=\"genis\"><h3>Sohbet</h3>" + (sohbet.length ? "<ol class=\"sohbet\">" + sohbet.map(function(m){ return "<li><p class=\"soru\">" + esc(m.soru) + "</p><p class=\"cevap\">" + esc(m.yanit) + "</p></li>"; }).join("") + "</ol>" : "<p class=\"kucuk\">Bu talep asistan sohbeti olmadan, doğrudan formdan bırakıldı.</p>") + "</section>" +
        "<section class=\"genis\"><h3>Arama ve hizmet</h3><div class=\"islem\">" +
          (x.arandi ? "<p>Arandı: <b>" + new Date(x.arandi).toLocaleString("tr-TR", {dateStyle: "short", timeStyle: "short"}) + "</b></p>" : "<button class=\"dugme\" type=\"button\" id=\"t-arandi\">Arandı olarak işaretleyin</button>") +
          "<label>Durum<select id=\"t-durum\">" + DURUM.map(function(d){ return "<option" + (d === x.durum ? " selected" : "") + ">" + d + "</option>"; }).join("") + "</select></label>" +
          "<label>Açılan hizmet<input id=\"t-hizmet\" value=\"" + esc(x.hizmet) + "\" placeholder=\"Örn. itiraz dilekçesi\"></label>" +
          "<label>Bedel (TL)<input id=\"t-bedel\" type=\"number\" min=\"0\" inputmode=\"decimal\" value=\"" + esc(x.bedel) + "\"></label>" +
          "<label class=\"tam\">Not<textarea id=\"t-not\" rows=\"3\">" + esc(x.not) + "</textarea></label></div>" +
          "<p class=\"kucuk\">Açılan hizmet ve bedel gelir payının dayanağıdır. Bildirim: bağlı değil (sunucu kurulunca WhatsApp).</p></section>" +
      "</div>";
    $("#t-geri").addEventListener("click", function(){ acikTalep = null; ciz["t-talep"](); });
    var yaz = function(alan, deger){ var l = talepler(); if (!l[i]) return; l[i][alan] = deger; depo.koy("ipece-talepler", l); talepSay(); };
    var ar = $("#t-arandi"); if (ar) ar.addEventListener("click", function(){ var l = talepler(); l[i].arandi = new Date().toISOString(); if (l[i].durum === "Yeni") l[i].durum = "Arandı"; depo.koy("ipece-talepler", l); talepSay(); talepEkrani(i); });
    $("#t-durum").addEventListener("change", function(){ yaz("durum", this.value); });
    $("#t-hizmet").addEventListener("change", function(){ yaz("hizmet", this.value); });
    $("#t-bedel").addEventListener("change", function(){ yaz("bedel", this.value); });
    $("#t-not").addEventListener("change", function(){ yaz("not", this.value); });
  };
  $("#p-talep").addEventListener("click", function(ev){ var b = ev.target.closest("[data-ac]"); if (b) talepEkrani(+b.getAttribute("data-ac")); });

  /* ---------- Kurum veritabanı ---------- */
  var ek = function(){ return depo.al("ipece-ek", {}); };
  var ekKolon = function(){ return depo.al("ipece-ek-kolon", []); };
  ciz["t-kurum"] = function(){
    var p = $("#p-kurum");
    var ilceler = K.map(function(k){ return k.ilce; }).filter(function(v, i, a){ return a.indexOf(v) === i; }).sort(function(a, b){ return a.localeCompare(b, "tr"); });
    p.innerHTML = "<div class=\"suzgec\" style=\"border-top:0\"><label for=\"pk-ara\">Kurum adı<input id=\"pk-ara\" type=\"search\" autocomplete=\"off\"></label>" +
      "<label for=\"pk-ilce\">İlçe<select id=\"pk-ilce\"><option value=\"\">Tüm ilçeler</option>" + ilceler.map(function(v){ return "<option>" + esc(v) + "</option>"; }).join("") + "</select></label>" +
      "<label class=\"kutu\" for=\"pk-acik\"><input id=\"pk-acik\" type=\"checkbox\">Yalnız açık talebi olanlar</label></div>" +
      "<p class=\"kucuk\" id=\"pk-say\"></p><div class=\"tablo-kap\"><table class=\"panel-tablo\" id=\"pk-tablo\"></table></div>" +
      "<p class=\"not-kutusu\" style=\"margin-top:1.2rem\">Telefon ve sorumlu adı gibi alanlar herkese açık sitede hiçbir zaman görünmez. Bu önizlemede bu alanlar <a href=\"#excel\" data-git=\"t-excel\">Excel ile eşleştir</a> bölümünden, kendi dosyanızdan eklenir ve yalnız bu tarayıcıda kalır.</p>";
    var c = function(){
      var q = kat($("#pk-ara").value.trim()), il = $("#pk-ilce").value, E = ek(), EK = ekKolon(), yalniz = $("#pk-acik").checked;
      var acik = {}; talepler().forEach(function(t, i){ if (t.durum !== "Kapandı") { var kk = kurumBul(t.kurum); if (kk) (acik[kk.s] = acik[kk.s] || []).push(i); } });
      var r = K.filter(function(k){ return (!il || k.ilce === il) && (!q || kat(k.ad).indexOf(q) >= 0) && (!yalniz || acik[k.s]); });
      $("#pk-say").textContent = r.length + " kurum" + (EK.length ? " · eklenen kolonlar: " + EK.join(", ") : "");
      $("#pk-tablo").innerHTML = "<thead><tr><th>Kurum</th><th>İlçe</th>" + EK.map(function(k){ return "<th>" + esc(k) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        r.slice(0, 200).map(function(k){ return "<tr" + (acik[k.s] ? " class=\"acik-satir\"" : "") + "><td>" + esc(k.ad) + (acik[k.s] ? " <button type=\"button\" class=\"cip acik bag-cip\" data-talep=\"" + acik[k.s][0] + "\">Açık talep</button>" : "") + "</td><td>" + esc(k.ilce) + "</td>" + EK.map(function(c2){ return "<td>" + esc((E[k.s] || {})[c2]) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody>";
    };
    $("#pk-ara").addEventListener("input", c); $("#pk-ilce").addEventListener("change", c); $("#pk-acik").addEventListener("change", c); c();
    if (!p.dataset.dinle) p.dataset.dinle = "1", p.addEventListener("click", function(ev){ var b = ev.target.closest("[data-talep]"); if (b) { var tt = $("#t-talep"); ac(tt); talepEkrani(+b.getAttribute("data-talep")); } });
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
      "<div class=\"excel-adim\" id=\"x-ayar\" hidden><h2 class=\"pb\">2. Ne yapılacağını yazın</h2>" +
      "<form class=\"cumle\" id=\"x-cumle-form\"><label for=\"x-cumle\">Örnek: “Telefon kolonunu kurumlara ekle” ya da “E kolonunu Sorumlu adıyla ekle”</label>" +
      "<div class=\"cumle-satir\"><input id=\"x-cumle\" autocomplete=\"off\"><button class=\"dugme\" type=\"submit\">Uygulayın</button></div><p id=\"x-anlasilan\" class=\"anlasilan\" role=\"status\" hidden></p></form>" +
      "<details class=\"elle\"><summary>Kolonları elle seçin</summary>" +
      "<div class=\"alanlar\"><label for=\"x-ad\">Kurum adının olduğu kolon<select id=\"x-ad\"></select></label>" +
      "<label for=\"x-ekle\">Kurumlara eklenecek kolon<select id=\"x-ekle\"></select></label>" +
      "<label for=\"x-baslik\">Panelde görünecek ad<input id=\"x-baslik\" placeholder=\"Örn. Telefon\"></label></div>" +
      "<label class=\"kutu\" style=\"margin-top:.6rem\"><input type=\"checkbox\" id=\"x-ilk\" checked> İlk satır başlık</label></details>" +
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
    /* 12: ne yapılacağı düz cümleyle yazılır; kural tabanlı çözümlenir, önce önizleme gösterilir */
    $("#x-cumle-form").addEventListener("submit", function(ev){
      ev.preventDefault();
      var c = kat($("#x-cumle").value.trim()), out = $("#x-anlasilan");
      var gen = tablo.reduce(function(a, r){ return Math.max(a, r.length); }, 0);
      var bas = $("#x-ilk").checked ? tablo[0] : [];
      var kolonBul = function(metin){
        var m = metin.match(/(?:^|\s)([a-zçğıöşü])\s*kolon/);
        if (m) { var i = m[1].toLocaleUpperCase("tr").charCodeAt(0) - 65; if (i >= 0 && i < gen) return i; }
        for (var i2 = 0; i2 < gen; i2++) { var b = kat(bas[i2] || ""); if (b && b.length > 2 && metin.indexOf(b) >= 0) return i2; }
        var desen = { "telefon": /^[\d\s()+-]{10,}$/, "e-posta": /@/, "eposta": /@/ };
        for (var ad in desen) {
          if (metin.indexOf(ad) < 0) continue;
          for (var i3 = 0; i3 < gen; i3++) {
            if (tablo.slice(0, 30).filter(function(r){ return desen[ad].test(String(r[i3] || "")); }).length > 10) return i3;
          }
        }
        return -1;
      };
      var ekle = /ekle/.test(c), esle = /eşle/.test(c);
      if (!ekle && !esle) { out.hidden = false; out.textContent = "Anlaşılamadı. Cümlede “ekle” ya da “eşle” geçmeli; örneğin “Telefon kolonunu kurumlara ekle”."; return; }
      var ki = kolonBul(c.replace(/(adıyla|olarak|başlığıyla).*$/, ""));
      var baslik = (c.match(/(\S+)\s+(adıyla|olarak|başlığıyla)/) || [])[1];
      if (ekle && ki < 0) { out.hidden = false; out.textContent = "Hangi kolonun ekleneceği anlaşılamadı. Kolon başlığını ya da harfini yazın (ör. “E kolonunu ekle”)."; return; }
      if (ki >= 0) $("#x-ekle").value = ki;
      var ad2 = baslik ? baslik.charAt(0).toLocaleUpperCase("tr") + baslik.slice(1) : (ki >= 0 && bas[ki] ? bas[ki] : (c.indexOf("telefon") >= 0 ? "Telefon" : ""));
      if (ad2) $("#x-baslik").value = ad2;
      $("#x-ekle").dataset.kapali = ekle ? "" : "1";
      out.hidden = false;
      out.innerHTML = "Anlaşılan: kurum adı <b>" + String.fromCharCode(65 + +$("#x-ad").value) + "</b> kolonundan eşlenecek" +
        (ekle ? ", <b>" + String.fromCharCode(65 + +$("#x-ekle").value) + "</b> kolonu “" + esc($("#x-baslik").value || "Kolon") + "” adıyla kurumlara eklenecek." : "; kolon eklenmeyecek, yalnız eşleşme raporu çıkacak.");
      $("#x-onizle").click();
    });
    $("#x-onizle").addEventListener("click", function(){
      var ai = +$("#x-ad").value, ei = +$("#x-ekle").value;
      var bas = $("#x-ilk").checked ? tablo[0] : null;
      var baslik = $("#x-baslik").value.trim() || (bas && bas[ei]) || ("Kolon " + String.fromCharCode(65 + ei));
      var satirlar = $("#x-ilk").checked ? tablo.slice(1) : tablo;
      var es = [], yok = [], supheli = [];
      var kelime = function(t){ return norm(t).split(" ").filter(function(w){ return w.length > 2; }); };
      var benzer = function(ad){
        var a = kelime(ad); if (!a.length) return null;
        var en = null, skor = 0;
        K.forEach(function(k){
          var b = kelime(k.ad), ort = a.filter(function(w){ return b.indexOf(w) >= 0; }).length, sk = ort / Math.max(a.length, b.length);
          if (sk > skor) { skor = sk; en = k; }
        });
        return skor >= 0.5 ? [en, skor] : null;
      };
      satirlar.forEach(function(r){
        var k = indeks()[norm(r[ai])];
        if (k) { es.push([k, r[ei] || ""]); return; }
        if (!String(r[ai] || "").trim()) return;
        var b2 = benzer(r[ai]);
        if (b2) supheli.push([b2[0], r[ei] || "", r[ai], b2[1]]); else yok.push(r[ai]);
      });
      var sadeceEsle = $("#x-ekle").dataset.kapali === "1";

      var s = $("#x-sonuc"); s.hidden = false;
      s.innerHTML = "<h2 class=\"pb\">3. Önizleme</h2><div class=\"olcu\"><div><b>" + es.length + "</b>eşleşen</div><div><b>" + supheli.length + "</b>şüpheli</div><div><b>" + yok.length + "</b>bulunamayan</div><div><b>" + (sadeceEsle ? "—" : esc(baslik)) + "</b>" + (sadeceEsle ? "yalnız eşleşme raporu" : "eklenecek kolon") + "</div></div>" +
        (supheli.length ? "<h3 style=\"margin-top:1.2rem\">Şüpheli eşleşmeler</h3><p class=\"kucuk\">Ad birebir tutmadı; en yakın kurum önerildi. Eklenmesini istediklerinizi işaretleyin.</p><div class=\"tablo-kap\"><table class=\"panel-tablo\"><thead><tr><th></th><th>Dosyadaki ad</th><th>Önerilen kurum</th></tr></thead><tbody>" +
          supheli.map(function(x, i){ return "<tr><td><input type=\"checkbox\" class=\"sup\" data-i=\"" + i + "\" aria-label=\"Ekle\"></td><td>" + esc(x[2]) + "</td><td>" + esc(x[0].ad) + "</td></tr>"; }).join("") + "</tbody></table></div>" : "") +
        "<div class=\"iki\" style=\"margin-top:1.2rem;gap:2rem\"><div><h3>Eşleşenlerden örnek</h3><div class=\"tablo-kap\"><table class=\"panel-tablo\"><thead><tr><th>Kurum</th><th>" + esc(baslik) + "</th></tr></thead><tbody>" +
        es.slice(0, 8).map(function(x){ return "<tr><td>" + esc(x[0].ad) + "</td><td>" + esc(x[1]) + "</td></tr>"; }).join("") + "</tbody></table></div></div>" +
        "<div><h3>Bulunamayanlar</h3>" + (yok.length ? "<ul class=\"yok-liste\">" + yok.slice(0, 30).map(function(v){ return "<li>" + esc(v) + "</li>"; }).join("") + "</ul>" + (yok.length > 30 ? "<p class=\"kucuk\">ve " + (yok.length - 30) + " satır daha</p>" : "") : "<p class=\"kucuk\">Hepsi eşleşti.</p>") + "</div></div>" +
        (sadeceEsle ? "" : "<p style=\"margin-top:1.2rem;display:flex;gap:.6rem;flex-wrap:wrap\"><button class=\"dugme\" type=\"button\" id=\"x-onay\"" + (es.length ? "" : " disabled") + ">Onaylayın ve kurumlara ekleyin</button></p><p class=\"kucuk\">Onaylanmadan hiçbir şey yazılmaz.</p>") + "<p id=\"x-yazildi\" class=\"kucuk\" role=\"status\"></p>";
      if (sadeceEsle) return;
      $("#x-onay").addEventListener("click", function(){
        var E = ek(), EK = ekKolon();
        var secili = $$(".sup:checked", s).map(function(c2){ return supheli[+c2.getAttribute("data-i")]; });
        es.concat(secili).forEach(function(x){ (E[x[0].s] = E[x[0].s] || {})[baslik] = x[1]; });
        if (EK.indexOf(baslik) < 0) EK.push(baslik);
        var ok = depo.koy("ipece-ek", E) && depo.koy("ipece-ek-kolon", EK);
        $("#x-yazildi").innerHTML = ok ? "<strong>" + (es.length + secili.length) + " kuruma “" + esc(baslik) + "” eklendi.</strong> <a href=\"#kurum\" data-git=\"t-kurum\">Kurum veritabanında görün</a>" : "Yazılamadı: tarayıcı yerel kaydı engelliyor.";
        this.disabled = true;
      });
    });
  };

  /* ---------- 13 Yaptırım defteri: tutar kuralı, düzeltme, Balrium onayı ---------- */
  var TIPLER = ["sabit", "katsayı", "kişi/ay başı", "alt bende göre", "aralık", "formül", "olay verisi gerekli", "doğrulanmadı"];
  var defter = function(){ return depo.al("ipece-defter", {}); };
  ciz["t-defter"] = function(){
    var p = $("#p-defter");
    var D = defter();
    var onayli = V.satir.filter(function(x){ return (D[x.slug] || {}).onay; }).length;
    var tipSay = {}; V.satir.forEach(function(x){ tipSay[x.tip] = (tipSay[x.tip] || 0) + 1; });
    p.innerHTML = "<div class=\"olcu\"><div><b>" + V.satir.length + "</b>yükümlülük</div><div><b>" + onayli + "</b>Balrium onaylı</div><div><b>" + (tipSay["katsayı"] || 0) + "</b>asgari ücrete bağlı</div><div><b>" + (tipSay["doğrulanmadı"] || 0) + "</b>doğrulanmadı</div></div>" +
      "<div class=\"suzgec\" style=\"border-top:0\"><label for=\"d-kanun\">Kanun<select id=\"d-kanun\"><option value=\"\">Tüm kanunlar</option>" + Object.keys(V.kanun).map(function(k){ return "<option value=\"" + k + "\">" + k + " · " + esc(V.kanun[k]) + "</option>"; }).join("") + "</select></label>" +
      "<label for=\"d-tip\">Tutar kuralı<select id=\"d-tip\"><option value=\"\">Tümü</option>" + TIPLER.filter(function(t){ return tipSay[t]; }).map(function(t){ return "<option>" + t + " (" + tipSay[t] + ")</option>"; }).join("") + "</select></label>" +
      "<label class=\"kutu\" for=\"d-bekleyen\"><input id=\"d-bekleyen\" type=\"checkbox\">Yalnız onay bekleyenler</label></div>" +
      "<div class=\"tablo-kap\"><table class=\"panel-tablo\"><thead><tr><th>Madde</th><th>Yükümlülük ve ihlal</th><th>2026 tutarı</th><th>Kural</th><th>Balrium</th><th></th></tr></thead><tbody id=\"d-govde\"></tbody></table></div>" +
      "<p class=\"kucuk\" style=\"margin-top:.8rem\">Katsayılı satırların tutarı Tutar parametreleri'nden gelir; burada yalnız diğer satırların tutarı düzeltilir. Yayınlanan düzeltme sitede bu tarayıcıda hemen görünür.</p>";
    var c = function(){
      var k = $("#d-kanun").value, t = $("#d-tip").value.replace(/ \(\d+\)$/, ""), b = $("#d-bekleyen").checked, D2 = defter();
      $("#d-govde").innerHTML = V.satir.filter(function(x){ return (!k || x.k === k) && (!t || x.tip === t) && (!b || !(D2[x.slug] || {}).onay); }).map(function(x){
        var d = D2[x.slug] || {};
        return "<tr data-s=\"" + x.slug + "\"><td><a href=\"" + kok + "yukumlulukler/" + x.slug + "/\"><span class=\"kod\">" + esc(x.kod) + "</span></a></td><td><b>" + esc(x.yuk) + "</b><br><span class=\"kucuk\">" + esc(x.ihlal) + "</span></td>" +
          "<td class=\"" + (x.dogru ? "tutar" : "dogrulanmadi") + "\">" + esc(x.tutar) + (d.yayinda && d.tutar && !x.kat ? "<br><span class=\"cip onizleme\">Düzeltildi</span>" : "") + "</td>" +
          "<td><span class=\"cip tip\">" + esc(x.tip) + "</span></td>" +
          "<td><label class=\"kutu\"><input type=\"checkbox\" data-onay" + (d.onay ? " checked" : "") + "> " + (d.onay ? "Onaylı" : "Onay bekliyor") + "</label></td>" +
          "<td>" + (x.kat ? "" : "<button type=\"button\" class=\"bag\" data-duzenle>Düzelt</button>") + "</td></tr>";
      }).join("");
    };
    ["#d-kanun", "#d-tip", "#d-bekleyen"].forEach(function(s2){ $(s2).addEventListener("change", c); });
    c();
    if (p.dataset.dinle) return;
    p.dataset.dinle = "1";
    p.addEventListener("change", function(ev){
      if (!ev.target.hasAttribute("data-onay")) return;
      var s2 = ev.target.closest("tr").getAttribute("data-s"), D2 = defter();
      D2[s2] = D2[s2] || {}; D2[s2].onay = ev.target.checked; D2[s2].onayTarihi = new Date().toISOString();
      depo.koy("ipece-defter", D2); ciz["t-defter"]();
    });
    p.addEventListener("click", function(ev){
      var b = ev.target.closest("[data-duzenle]"); if (!b) return;
      var tr = b.closest("tr"), s2 = tr.getAttribute("data-s"), x = V.satir.filter(function(y){ return y.slug === s2; })[0];
      var acikMi = tr.nextElementSibling && tr.nextElementSibling.classList.contains("duzen-satir");
      $$(".duzen-satir", p).forEach(function(r){ r.remove(); });
      if (acikMi) return;
      var d = defter()[s2] || {};
      var yeni = document.createElement("tr"); yeni.className = "duzen-satir";
      yeni.innerHTML = "<td colspan=\"6\"><div class=\"duzen\"><label>2026 tutarı<input id=\"dz-tutar\" value=\"" + esc(d.tutar || x.tutar.replace(/ TL/g, "")) + "\"></label>" +
        "<p class=\"kucuk\">Örnek biçimler: “9.943”, “9.943 / işçi”, “85.437–1.709.200”, “doğrulanmadı”.</p>" +
        "<div class=\"dugmeler\"><button class=\"dugme\" type=\"button\" id=\"dz-yayinla\">Yayınlayın</button><button class=\"dugme ikincil\" type=\"button\" id=\"dz-geri\">Listedeki değere dönün</button></div></div></td>";
      tr.after(yeni);
      $("#dz-yayinla").addEventListener("click", function(){
        var v = $("#dz-tutar").value.trim(); if (!v) return;
        var D2 = defter(); D2[s2] = D2[s2] || {}; D2[s2].tutar = v; D2[s2].yayinda = true; D2[s2].tarih = new Date().toISOString();
        depo.koy("ipece-defter", D2); location.reload();
      });
      $("#dz-geri").addEventListener("click", function(){ var D2 = defter(); if (D2[s2]) { delete D2[s2].tutar; delete D2[s2].yayinda; } depo.koy("ipece-defter", D2); location.reload(); });
    });
  };

  /* ---------- 14 Makaleler: düz metin → başlık, meta, arama önizlemesi; taslak → yayın; sürümler ---------- */
  var makaleler = function(){ return depo.al("ipece-makaleler", {}); };
  var SITE_MAKALE = "4857-98-muvazaali-alt-isverenlik";
  ciz["t-makale"] = function(){
    var p = $("#p-makale"), M = makaleler();
    var yayinda = V.satir.filter(function(x){ return x.slug === SITE_MAKALE || (M[x.slug] || {}).yayinda; }).length;
    var secili = p.dataset.secili || "";
    p.innerHTML = "<div class=\"olcu\"><div><b>" + yayinda + " / " + V.satir.length + "</b>makalesi yayında</div><div><b>" + Object.keys(M).filter(function(k){ return !M[k].yayinda; }).length + "</b>taslak</div><div><b>~200</b>hedef kelime</div><div><b>60 · 155</b>meta başlık · açıklama sınırı</div></div>" +
      "<div class=\"makale-duzen\"><div class=\"makale-liste\"><label for=\"m-ara\" class=\"kucuk\">Yükümlülük ara</label><input id=\"m-ara\" type=\"search\" autocomplete=\"off\"><ul id=\"m-liste\"></ul></div><div id=\"m-editor\"></div></div>";
    var liste = function(){
      var q = kat($("#m-ara").value.trim()), M2 = makaleler();
      $("#m-liste").innerHTML = V.satir.filter(function(x){ return !q || kat(x.kod + " " + x.yuk).indexOf(q) >= 0; }).map(function(x){
        var m = M2[x.slug], dur = x.slug === SITE_MAKALE ? ["onizleme", "Yayında"] : m ? (m.yayinda ? ["onizleme", "Yayında"] : ["sirada", "Taslak"]) : ["yok", "Yazılmadı"];
        return "<li><button type=\"button\" data-m=\"" + x.slug + "\"" + (x.slug === secili ? " aria-current=\"true\"" : "") + "><span class=\"kod\">" + esc(x.kod) + "</span><span>" + esc(x.yuk) + "</span><span class=\"cip " + dur[0] + "\">" + dur[1] + "</span></button></li>";
      }).join("");
    };
    $("#m-ara").addEventListener("input", liste); liste();
    $("#m-liste").addEventListener("click", function(ev){ var b = ev.target.closest("[data-m]"); if (b) { p.dataset.secili = b.getAttribute("data-m"); editor(b.getAttribute("data-m")); liste(); } });
    var editor = function(slug){
      var x = V.satir.filter(function(y){ return y.slug === slug; })[0], m = makaleler()[slug] || {};
      var ed = $("#m-editor");
      if (slug === SITE_MAKALE) {
        ed.innerHTML = "<h2 class=\"pb\">" + esc(x.kod) + " · " + esc(x.yuk) + "</h2><p>Bu maddenin makalesi Balrium'dan geldi ve sitede yayında.</p><p><a href=\"" + kok + "yayinlar/muvazaali-alt-isverenlikte-idari-para-cezasi/\">Makaleyi açın</a></p>";
        return;
      }
      var varsayilanBaslik = x.yuk + ": " + x.ihlal.charAt(0).toLocaleLowerCase("tr") + x.ihlal.slice(1);
      ed.innerHTML = "<h2 class=\"pb\"><span class=\"kod\">" + esc(x.kod) + "</span> " + esc(x.yuk) + "</h2>" +
        "<div class=\"form\" style=\"max-width:none\"><label for=\"m-baslik\">Başlık (H1)<input id=\"m-baslik\" value=\"" + esc(m.baslik || varsayilanBaslik) + "\"></label>" +
        "<label for=\"m-metin\">Metin (düz yazı; paragrafları boş satırla ayırın)<textarea id=\"m-metin\" rows=\"10\">" + esc(m.metin || "") + "</textarea></label>" +
        "<p class=\"sayac-satir\" id=\"m-kelime\"></p>" +
        "<label for=\"m-mb\">Meta başlık<input id=\"m-mb\" value=\"" + esc(m.metaBaslik || "") + "\" placeholder=\"Boş bırakılırsa başlıktan üretilir\"></label><p class=\"sayac-satir\" id=\"m-mb-say\"></p>" +
        "<label for=\"m-ma\">Meta açıklama<textarea id=\"m-ma\" rows=\"2\" placeholder=\"Boş bırakılırsa metnin ilk cümlelerinden üretilir\">" + esc(m.metaAciklama || "") + "</textarea></label><p class=\"sayac-satir\" id=\"m-ma-say\"></p></div>" +
        "<h3 style=\"margin-top:1.4rem\">Arama sonucunda görünüşü</h3><div class=\"serp\" id=\"m-serp\"></div>" +
        "<div class=\"dugmeler\" style=\"margin-top:1.2rem\"><button class=\"dugme ikincil\" type=\"button\" id=\"m-taslak\">Taslak kaydedin</button><button class=\"dugme\" type=\"button\" id=\"m-yayin\">Yayınlayın</button></div><p id=\"m-durum\" class=\"kucuk\" role=\"status\"></p>" +
        (m.surumler && m.surumler.length ? "<h3 style=\"margin-top:1.4rem\">Sürüm geçmişi</h3><ol class=\"surum\">" + m.surumler.slice().reverse().map(function(v){ return "<li><b>" + new Date(v.t).toLocaleString("tr-TR", {dateStyle: "short", timeStyle: "short"}) + "</b> · " + esc(v.durum) + " · " + v.kelime + " kelime</li>"; }).join("") + "</ol>" : "");
      var uret = function(){
        var baslik = $("#m-baslik").value.trim(), metin = $("#m-metin").value.trim();
        var mb = $("#m-mb").value.trim() || (baslik + " | ipece");
        var ilk = metin.replace(/\s+/g, " ").split(/(?<=[.!?])\s/).reduce(function(a, c2){ return (a + " " + c2).trim().length <= 155 ? (a + " " + c2).trim() : a; }, "");
        var ma = $("#m-ma").value.trim() || ilk;
        var kel = metin ? metin.split(/\s+/).length : 0;
        var durum = function(n, ust){ return n === 0 ? "" : n > ust ? " · <span class=\"tasma\">" + (n - ust) + " karakter fazla, arama sonucunda kesilir</span>" : " · uygun"; };
        $("#m-kelime").innerHTML = kel + " kelime" + (kel && kel < 150 ? " · hedefin altında" : kel > 300 ? " · hedefin üstünde" : kel ? " · uygun" : "");
        $("#m-mb-say").innerHTML = mb.length + " / 60" + durum(mb.length, 60);
        $("#m-ma-say").innerHTML = ma.length + " / 155" + durum(ma.length, 155);
        $("#m-serp").innerHTML = "<span class=\"serp-yol\">ipece.org › yukumlulukler › " + esc(slug.slice(0, 30)) + "</span><span class=\"serp-baslik\">" + esc(mb.length > 60 ? mb.slice(0, 57) + "…" : mb) + "</span><span class=\"serp-aciklama\">" + esc(ma ? (ma.length > 155 ? ma.slice(0, 152) + "…" : ma) : "Meta açıklama için metin yazın.") + "</span>";
        return { baslik: baslik, metin: metin, metaBaslik: $("#m-mb").value.trim(), metaAciklama: $("#m-ma").value.trim(), kelime: kel };
      };
      ["#m-baslik", "#m-metin", "#m-mb", "#m-ma"].forEach(function(s2){ $(s2).addEventListener("input", uret); });
      uret();
      var kaydet2 = function(yayin){
        var v = uret();
        if (!v.metin) { $("#m-durum").textContent = "Metin boş; kaydetmek için metin yazın."; return; }
        var M2 = makaleler(), eski = M2[slug] || {};
        var yeni = { baslik: v.baslik, metin: v.metin, metaBaslik: v.metaBaslik, metaAciklama: v.metaAciklama, surumler: (eski.surumler || []).concat([{ t: new Date().toISOString(), durum: yayin ? "Yayınlandı" : "Taslak", kelime: v.kelime }]) };
        yeni.yayinda = !!yayin; if (yayin) yeni.yayinTarihi = new Date().toISOString(); else if (eski.yayinTarihi) yeni.yayinTarihi = eski.yayinTarihi;
        M2[slug] = yeni;
        var ok = depo.koy("ipece-makaleler", M2);
        ciz["t-makale"]();
        $("#m-durum").innerHTML = !ok ? "Kaydedilemedi: tarayıcı yerel kaydı engelliyor." : yayin ? "Yayınlandı. <a href=\"" + kok + "yukumlulukler/" + slug + "/\">Künyede görün</a>" : "Taslak kaydedildi; sitede görünmez.";
      };
      $("#m-taslak").addEventListener("click", function(){ kaydet2(false); });
      $("#m-yayin").addEventListener("click", function(){ kaydet2(true); });
    };
    if (secili) editor(secili); else $("#m-editor").innerHTML = "<div class=\"bos-durum\"><h2 class=\"pb\">Bir yükümlülük seçin</h2><p>Balrium düz metni yazar. Başlık yapısı, meta başlık ve açıklama, arama sonucu görünüşü ve uzunluk denetimi buradan gelir.</p></div>";
  };

  /* ---------- 15 Rapor: sohbet → talep → hizmet; en çok sorulan maddeler; cevaplanamayan sorular ---------- */
  ciz["t-rapor"] = function(){
    var p = $("#p-rapor"), S = depo.al("ipece-sohbet", []), T = talepler();
    var cevapli = S.filter(function(x){ return x.cevap; }).length;
    var arandi = T.filter(function(x){ return x.arandi; }).length;
    var hizmet = T.filter(function(x){ return x.durum === "Hizmet açıldı" || (x.durum === "Kapandı" && x.bedel); }).length;
    var bedel = T.reduce(function(a, x){ return a + (parseFloat(x.bedel) || 0); }, 0);
    var adim = [["Asistan sohbeti", S.length], ["Kayıtla cevaplanan", cevapli], ["Talep", T.length], ["Arandı", arandi], ["Hizmet açıldı", hizmet]];
    var enCok = {}; S.forEach(function(x){ (x.kodlar || []).slice(0, 1).forEach(function(k){ enCok[k] = (enCok[k] || 0) + 1; }); });
    T.forEach(function(x){ if (x.kod) enCok[x.kod] = (enCok[x.kod] || 0) + 1; });
    var sirali = Object.keys(enCok).sort(function(a, b){ return enCok[b] - enCok[a]; }).slice(0, 8);
    var cevapsiz = S.filter(function(x){ return !x.cevap && x.soru; });
    var ustDeger = Math.max.apply(null, adim.map(function(a){ return a[1]; }).concat([1]));
    p.innerHTML = (S.length || T.length ? "" : "<p class=\"onizleme-not\" style=\"margin-bottom:1.2rem\">Bu tarayıcıda henüz sohbet ya da talep yok. Sitede asistana soru sorulduğunda ve talep bırakıldığında sayılar burada oluşur.</p>") +
      "<h2 class=\"pb\">Sohbetten hizmete</h2><ol class=\"huni\">" + adim.map(function(a, i){
        var oran = i && adim[i - 1][1] ? "%" + Math.round(a[1] / adim[i - 1][1] * 100) : "";
        return "<li><span class=\"huni-ad\">" + a[0] + "</span><span class=\"huni-cubuk\"><span style=\"width:" + (a[1] / ustDeger * 100) + "%\"></span></span><b>" + a[1] + "</b><span class=\"kucuk\">" + (oran ? oran + " önceki adımdan" : "") + "</span></li>";
      }).join("") + "</ol><p class=\"kucuk\">Açılan hizmet bedeli toplamı: <b>" + tl(bedel) + "</b></p>" +
      "<div class=\"iki\" style=\"margin-top:2rem;gap:2.5rem\"><div><h2 class=\"pb\">En çok sorulan maddeler</h2>" +
        (sirali.length ? "<ol class=\"sira\">" + sirali.map(function(k){ var x = V.satir.filter(function(y){ return y.kod === k; })[0]; return "<li><span class=\"kod\">" + esc(k) + "</span> " + esc(x ? x.yuk : "") + "<b>" + enCok[k] + "</b></li>"; }).join("") + "</ol>" : "<p class=\"kucuk\">Henüz veri yok.</p>") + "</div>" +
      "<div><h2 class=\"pb\">Cevaplanamayan sorular</h2><p class=\"kucuk\" style=\"margin-bottom:.6rem\">Yazılacak yeni makalelerin listesi.</p>" +
        (cevapsiz.length ? "<ul class=\"cevapsiz\">" + cevapsiz.slice(0, 15).map(function(x){ return "<li>“" + esc(x.soru) + "”<span class=\"kucuk\">" + new Date(x.t).toLocaleDateString("tr-TR") + "</span></li>"; }).join("") + "</ul>" : "<p class=\"kucuk\">Henüz cevaplanamayan soru yok.</p>") + "</div></div>";
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
