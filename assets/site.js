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
    var hesapla = function(){
      var a = parseInt(ad.value, 10) || 0, m = ayli ? (parseInt(ay.value, 10) || 0) : 1;
      out.textContent = (a > 0 && m > 0) ? tl(bt * a * m) : "—";
    };
    ad.addEventListener("input", hesapla); if (ay) ay.addEventListener("input", hesapla); hesapla();
  }

  /* soru asistanı: yalnız yükümlülük kayıtlarından yanıt verir, her yanıt kaynağa bağlanır */
  var af = $("#asistan-form");
  if (af && V) af.addEventListener("submit", function(e){
    e.preventDefault();
    var c = $("#asistan-yanit"), q = kat($("#asistan-soru").value);
    c.hidden = false;
    var AD = {"kvkk":"6698","kişisel veri":"6698","sgk":"5510","sigorta":"5510","iş kanunu":"4857","tüketici":"6502","imar":"3194","çevre":"2872","trafik":"2918","taşıma":"4925","engelliler":"5378"};
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
    if (!r.length) {
      c.innerHTML = "Sorunuzla eşleşen bir kayıt bulamadık. Kanun ve madde numarasını yazarsanız (örneğin “4857/98”) ilgili yükümlülüğü gösteririz. Dosyanız için <a href=\"" + kok + "iletisim/\">bize yazın</a>.";
      return;
    }
    var n = r.length; r = r.slice(0, 5);
    c.innerHTML = "<strong>" + (n > 1 ? "İlgili yükümlülükler" : "İlgili yükümlülük") + (n > 5 ? " (ilk 5 / " + n + ")" : "") + "</strong><ul>" +
      r.map(function(x){ return "<li><a href=\"" + kok + "yukumlulukler/" + x.slug + "/\"><span class=\"kod\">" + esc(x.kod) + "</span> " + esc(x.yuk) + "</a>: " + esc(x.ihlal) + ". 2026 tutarı " +
        (x.dogru ? "<span class=\"tutar\">" + esc(x.tutar) + "</span>" : "<span class=\"dogrulanmadi\">" + esc(x.tutar) + "</span>") + ".</li>"; }).join("") +
      "</ul><span class=\"kucuk\">Kaynak: Balrium 2026 yaptırım envanteri. Bu yanıt genel bilgidir; somut dosyanız için <a href=\"" + kok + "iletisim/\">bize yazın</a>.</span>";
  });

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
