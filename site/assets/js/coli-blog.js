/* ═══════════════════════════════════════════════════════════════
   COLI LOTERIAS — BLOG (lista, agendamento e página da matéria)
   As matérias são publicadas automaticamente: cada card/página tem uma
   data e só aparece na lista quando a data chega. data/blog.json é gerado
   pelo build (tools/build.py) a partir de tools/blog_posts.py.
   ═══════════════════════════════════════════════════════════════ */
(function(){
"use strict";
var CFG=window.COLI_CONFIG||{}, $=function(id){return document.getElementById(id);};
var MESES=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
function hoje(){ var d=new Date(); return new Date(d.getFullYear(),d.getMonth(),d.getDate()); }
function iso2date(s){ var p=String(s).slice(0,10).split("-"); return new Date(+p[0],+p[1]-1,+p[2]); }
function fmtLonga(s){ var d=iso2date(s); return d.getDate()+" de "+MESES[d.getMonth()]+" de "+d.getFullYear(); }
COLI.blog = {
  publicadas: function(lista){ var h=hoje(); return (lista||[]).filter(function(p){ return iso2date(p.data)<=h; }).sort(function(a,b){ return a.data<b.data?1:-1; }); },
  proxima: function(lista){ var h=hoje(); var f=(lista||[]).filter(function(p){ return iso2date(p.data)>h; }).sort(function(a,b){ return a.data<b.data?-1:1; }); return f[0]||null; },
  cardHTML: function(p){
    var j=p.loteria?COLI.byId(p.loteria):null, cor=j?j.c1:"#1435a8", emo=j?j.emo:"📰";
    return '<a class="bcard" href="blog-'+p.slug+'.html" style="--pc:'+cor+'" data-cat="'+COLI.esc(p.categoria)+'" data-date="'+p.data+'">'
      +'<div class="bc-top"><span class="bc-emo">'+emo+'</span><span class="bc-cat">'+COLI.esc(p.categoria)+'</span></div>'
      +'<h3>'+COLI.esc(p.titulo)+'</h3><p>'+COLI.esc(p.descricao)+'</p>'
      +'<div class="bc-meta"><time datetime="'+p.data+'">'+fmtLonga(p.data)+'</time><span>'+p.leitura+' min</span></div></a>';
  },
  fmtLonga: fmtLonga
};

document.addEventListener("DOMContentLoaded",function(){
  var page=document.body.getAttribute("data-page");
  COLI.getJSON((CFG.dataDir||"data/")+"blog.json",12000).then(function(d){
    var todas=(d&&d.posts)||[];
    var pub=COLI.blog.publicadas(todas), prox=COLI.blog.proxima(todas);

    /* ── lista do blog ── */
    var grid=$("blog-grid");
    if(grid){
      grid.innerHTML=pub.map(COLI.blog.cardHTML).join("");
      var st=$("blog-prox");
      if(st) COLI.ui.statusBar(st, prox?"":"warn", pub.length+" matéria"+(pub.length===1?"":"s")+(prox?" · próxima em "+fmtLonga(prox.data):""));
      var cats=$("blog-cats");
      if(cats) cats.addEventListener("click",function(e){
        var b=e.target.closest("button"); if(!b) return;
        cats.querySelectorAll("button").forEach(function(x){x.classList.remove("on");}); b.classList.add("on");
        var c=b.getAttribute("data-c"), n=0;
        grid.querySelectorAll(".bcard").forEach(function(card){ var ok=!c||card.getAttribute("data-cat")===c; card.hidden=!ok; if(ok) n++; });
        $("blog-vazio").hidden=n>0;
      });
    }

    /* ── página da matéria ── */
    var slug=document.body.getAttribute("data-post");
    if(slug){
      var rel=$("post-rel");
      if(rel){
        var outras=pub.filter(function(p){return p.slug!==slug;}).slice(0,5);
        rel.innerHTML=outras.length?outras.map(function(p){ return '<li><a href="blog-'+p.slug+'.html">'+COLI.esc(p.titulo)+'</a><span>'+fmtLonga(p.data)+'</span></li>'; }).join(""):'<li><span>Em breve, mais matérias.</span></li>';
      }
      var wa=$("post-wa");
      if(wa) wa.href="https://wa.me/?text="+encodeURIComponent(document.title.replace(/ \| .*$/,"")+"\n"+location.href);
    }

    /* ── bloco "Do blog" na home ── */
    var home=$("home-blog");
    if(home){
      if(!pub.length){ home.closest("section").hidden=true; return; }
      home.innerHTML=pub.slice(0,3).map(COLI.blog.cardHTML).join("");
    }
  }).catch(function(){ var st=$("blog-prox"); if(st) COLI.ui.statusBar(st,"warn","Não foi possível carregar a lista de matérias."); });
});
})();
