  // ---------- Vitrine do cliente: calendário editorial bonito, objetivo e fácil de consultar no celular ----------
  // Um só desenho para o modo "Ver como cliente" do painel e para o arquivo enviado ao cliente.
  var EMOJI_NICHO={psicologia:"🧠",saude:"🩺",nutricao_fitness:"💪",estetica_beleza:"💄",juridico:"⚖️",financas:"",educacao:"📚",moda:"👗",cosmeticos:"🌿",gastronomia:"🍽️",imobiliario:"🏡",arquitetura:"📐",eventos:"📸",pet:"🐾",turismo:"✈️",tecnologia_b2b:"💻"};
  var FUNIL_TXT={topo:["Topo de funil","Atrair gente nova"],meio:["Meio de funil","Aquecer e educar quem já segue"],fundo:["Fundo de funil","Transformar seguidores em clientes"]};
  var PROD_TXT={"Lo-fi":"Lo-fi, gravação simples no celular, espontânea e real.","Mid-fi":"Mid-fi, celular com boa luz, áudio limpo e cortes simples.","High-fi":"Hi-fi, produção caprichada: boa câmera, luz e edição."};
  var MESES_CURTOS=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  function vitrineOf(id){return ((DB_CLIENTS[id]||{}).vitrine)||{};}
  function emojiDoCliente(){try{return EMOJI_NICHO[currentNiche().perfil.key]||"";}catch(e){return "";}}
  function dataCurta(s){if(!isIsoDate(s))return s||"";var d=parseD(s);return d.getDate()+" "+MESES_CURTOS[d.getMonth()];}
  function periodoTxt(items){var ds=items.map(function(it){return it.data}).filter(isIsoDate).sort();if(!ds.length)return "";var a=parseD(ds[0]),b=parseD(ds[ds.length-1]);
    return dataCurta(ds[0])+(a.getFullYear()!==b.getFullYear()?" "+a.getFullYear():"")+" – "+dataCurta(ds[ds.length-1])+" "+b.getFullYear();}
  function mensagemPadrao(){
    var g=GENERATED||{},st=g.strategy||{},c=DB_CLIENTS[state.client]||{},m=c.metas||{},r=rotinaOf(state.client),fo=FUNIL_OPC.filter(function(x){return x[0]===(r.foco||"equilibrio")})[0];
    var foco=fo?{topo:"apresentar a sua marca para mais gente",meio:"aprofundar a conexão com quem já te acompanha",fundo:"transformar a confiança de quem te segue em decisão",equilibrio:"atrair, aproximar e converter com equilíbrio"}[fo[0]]:"construir presença com consistência";
    var pil=(st.pilares||[]).slice(0,3).map(function(p){return String(p).split(":")[0]}).join(", ");
    var t="Neste período, a direção é "+foco+(st.bigMessage?", sempre voltando à ideia central: “"+st.bigMessage+"”":"")+".";
    if(pil)t+=" Os conteúdos giram em torno de "+pil+", no seu jeito de falar"+(st.percepcao?", para reforçar a percepção de uma marca "+String(st.percepcao).toLowerCase():"")+".";
    t+=" Cada pauta tem um papel claro, e a força vem da constância, um conteúdo de cada vez.";
    return t;
  }
  function vtFormato(x){var d=(typeof nfFormatoByNome==="function"&&nfFormatoByNome(x.format||""))||null;
    return {sup:surfLbl(x.surface),ic:surfIc(x.surface),nome:(d&&d.nome)||x.format||"",desc:(d&&d.descricao)||"",prod:d&&PROD_TXT[d.producao]||""};}
  function vtTexto(it){var c=it.content,cr=it.carousel,s=it.stories;
    if(c&&(c.copy||(c.copyVariants&&c.copyVariants.media)))return c.copy||c.copyVariants.media;
    if(cr&&cr.copy)return cr.copy;
    if(s&&s.stories&&s.stories.length&&it.idea&&it.idea.surface==="Stories")return s.stories.map(function(q,i){return (i+1)+". "+q.fala}).join("\n");
    return "";}
  function vtRoteiro(it){var c=it.content,cr=it.carousel,x=it.idea||{},out=[];
    if(c&&c.roteiro&&c.roteiro.length){var R=c.roteiro;R.forEach(function(q,i){out.push({k:i===0?"Gancho":i===R.length-1?"CTA":"Desenvolvimento",lbl:q.label,v:q.text});});return {passos:out,sug:false};}
    if(cr&&cr.slides&&cr.slides.length){var S=cr.slides;S.forEach(function(q,i){out.push({k:i===0?"Gancho":i===S.length-1?"CTA":"Desenvolvimento",lbl:"Slide "+(i+1),v:(q.titulo||"")+(q.texto?", "+q.texto:"")});});return {passos:out,sug:false};}
    if(x.hook)out.push({k:"Gancho",v:x.hook});if(x.conceito||x.angulo)out.push({k:"Desenvolvimento",v:[x.conceito,x.angulo].filter(Boolean).join(" · ")});if(x.cta)out.push({k:"CTA",v:x.cta});
    return {passos:out,sug:true};}
  function vtStories(it,r){
    var x=it.idea||{},T=itemHora(it,r),st=storyTimes(r),antes=st.filter(function(t){return t<T}),depois=st.filter(function(t){return t>T});
    var tA=antes.length?antes[antes.length-1]:"Antes do post",tD=depois.length?depois[0]:"Logo após o post",ehStories=x.surface==="Stories";
    var s=it.stories&&it.stories.stories&&it.stories.stories.length?it.stories.stories:null;
    if(s){var metade=ehStories?0:Math.max(1,Math.floor(s.length/2));
      return {sug:false,passos:s.map(function(q,i){var pre=i<metade;return {t:ehStories?T:(pre?tA:tD),fase:ehStories?"":(pre?"Antes do post":"Depois do post"),papel:q.papel||"",fala:q.fala||"",visual:q.visual||"",inter:q.interacao||""};})};}
    var h=pecaTitulo(it);
    return {sug:true,passos:ehStories?[
      {t:T,fase:"",papel:"Abertura",fala:"Comece com uma pergunta ou cena do dia a dia ligada ao tema: “"+(x.hook||h)+"”",visual:"Você falando para a câmera",inter:"Enquete"},
      {t:T,fase:"",papel:"Conteúdo",fala:x.conceito||h,visual:"Bastidor ou demonstração",inter:""},
      {t:T,fase:"",papel:"Convite",fala:x.cta||"Convide para conversar no direct",visual:"Você falando para a câmera",inter:"Caixa de perguntas"}]:[
      {t:tA,fase:"Antes do post",papel:"Curiosidade",fala:"Puxe o assunto com uma pergunta: “"+(x.hook||h)+"”",visual:"Você falando para a câmera ou texto sobre uma foto do dia",inter:"Enquete ou caixa de perguntas"},
      {t:tA,fase:"Antes do post",papel:"Expectativa",fala:"Mostre um bastidor da produção e conte que às "+T+" sai um conteúdo sobre isso",visual:"Bastidor da gravação ou da arte",inter:"Lembrete de post (opcional)"},
      {t:tD,fase:"Depois do post",papel:"Chamada",fala:"Saiu! “"+h+"”, convide para ver o post completo",visual:"Print ou trecho do post",inter:"Figurinha de link para o post"},
      {t:tD,fase:"Depois do post",papel:"Conversa",fala:x.cta||"Pergunte o que a pessoa achou",visual:"Você falando para a câmera",inter:"Caixa de perguntas"}]};
  }
  function vtStatusHtml(it){return it.clientStatus==="aprovado"?'<span class="vt-st ok">Aprovada</span>':it.clientStatus==="ajuste"?'<span class="vt-st adj">Ajuste pedido</span>':'';}
  function vitrineHtml(items,mode){
    var r=rotinaOf(state.client),v=vitrineOf(state.client),c=DB_CLIENTS[state.client]||{};
    var ord=items.map(function(it,idx){return {it:it,idx:idx}}).filter(function(o){return isIsoDate(o.it.data)}).sort(function(a,b){var ka=a.it.data+itemHora(a.it,r),kb=b.it.data+itemHora(b.it,r);return ka<kb?-1:ka>kb?1:0;});
    var nome=clientName(state.client),area=c.niche||"",emoji=v.emoji||emojiDoCliente(),per=periodoTxt(items);
    var titulo=v.titulo||("Seu calendário de conteúdo"),msg=v.mensagem||mensagemPadrao();
    var aprov=items.filter(function(it){return it.clientStatus==="aprovado"}).length;
    var dias=(r.diasPost||[]).slice().sort().map(function(d){return DIAS_SEM[d]}).join(" · ");
    var h='<div class="vt" data-vt-mode="'+mode+'"><header class="vt-hero"><div class="vt-emoji">'+esc(emoji)+'</div>'+
      '<div class="vt-kicker">'+esc(nome)+(area?' · '+esc(area):'')+'</div><h1 class="vt-title">'+esc(titulo)+'</h1>'+
      '<div class="vt-meta">'+(per?'<span>'+esc(per)+'</span>':'')+'<span>'+items.length+' conteúdos</span>'+(dias?'<span>'+esc(dias)+'</span>':'')+'</div>'+
      '<p class="vt-msg">'+esc(msg)+'</p>'+
      '<div class="vt-prog"><div class="vt-bar"><i style="width:'+(items.length?Math.round(aprov*100/items.length):0)+'%"></i></div><span data-vt-prog>'+aprov+' de '+items.length+' pautas aprovadas</span></div>'+
      (mode==="painel"?'<button class="vt-edit" data-vt-edit>Editar topo</button>':'')+'</header>'+
      '<div class="vt-legend"><span>Toque numa pauta para ver o <b>texto pronto</b>, o <b>roteiro</b> e os <b>Stories</b>.</span></div>';
    var semana="";
    ord.forEach(function(o){var it=o.it,x=it.idea||{},id="pauta-"+(it.id||o.idx),d=parseD(it.data),mon=new Date(d.getTime());mon.setDate(d.getDate()-((d.getDay()+6)%7));var wk=fmtD(mon);
      if(wk!==semana){h+='<div class="vt-week">Semana de '+dataCurta(wk)+'</div>';semana=wk;}
      var f=vtFormato(x),tx=vtTexto(it),ro=vtRoteiro(it),sq=vtStories(it,r),fu=FUNIL_TXT[x.funil]||["",""],hd=pecaTitulo(it);
      h+='<details class="vt-p" id="'+id+'" data-vt-item="'+esc(it.id||"")+'" data-vt-status="'+esc(it.clientStatus||"")+'" data-vt-label="'+esc(dataBR(it.data)+" "+itemHora(it,r)+", "+hd)+'">'+
        '<summary><div class="vt-when"><b>'+esc(DIAS_SEM[d.getDay()])+'</b><span>'+d.getDate()+' '+MESES_CURTOS[d.getMonth()]+'</span><em>'+esc(itemHora(it,r))+'</em></div>'+
        '<div class="vt-sum"><div class="vt-chips"><span class="vt-chip">'+f.ic+' '+esc(f.sup)+'</span><span class="vt-chip f-'+esc(x.funil||"")+'">'+esc(fu[0].replace(" de funil",""))+'</span>'+vtStatusHtml(it)+'</div><div class="vt-hd">'+esc(hd)+'</div></div><span class="vt-arrow">›</span></summary>'+
        '<div class="vt-body"><nav class="vt-jump"><a href="#'+id+'-texto">Texto</a><a href="#'+id+'-roteiro">Roteiro</a><a href="#'+id+'-stories">Stories</a></nav>'+
        '<section><h4>O que publicar</h4>'+(x.tema?'<div class="vt-tag">'+esc(x.tema)+'</div>':'')+'<div class="vt-big">'+esc(hd)+'</div>'+(x.conceito&&x.conceito!==hd?'<p>'+esc(x.conceito)+'</p>':'')+'</section>'+
        '<section id="'+id+'-texto"><h4>Texto pronto</h4>'+(tx?'<div class="vt-copy" id="'+id+'-copy">'+esc(tx)+'</div><button class="vt-btn" data-vt-copy="'+id+'-copy">📋 Copiar texto</button>':'<p class="vt-soft">O texto desta pauta está em produção, em breve aparece aqui.</p>')+'</section>'+
        '<section id="'+id+'-roteiro"><h4>Como produzir</h4>'+(ro.passos.length?'<ol class="vt-steps">'+ro.passos.map(function(p){return '<li><b>'+esc(p.k)+'</b>'+(p.lbl&&String(p.lbl).toLowerCase().indexOf(p.k.toLowerCase())<0?' <span class="vt-soft">('+esc(p.lbl)+')</span>':'')+'<div>'+esc(p.v)+'</div></li>'}).join('')+'</ol>'+(ro.sug?'<p class="vt-soft">Roteiro-base, a versão final chega com o texto.</p>':''):'<p class="vt-soft">Roteiro em produção.</p>')+'</section>'+
        '<section><h4>Formato</h4><div class="vt-fmt"><b>'+f.ic+' '+esc(f.sup)+(f.nome?' · '+esc(f.nome):'')+'</b>'+(f.desc?'<div>'+esc(f.desc)+'</div>':'')+(f.prod&&x.surface!=="Carrossel"?'<div class="vt-soft">'+esc(f.prod)+'</div>':'')+'</div></section>'+
        '<section><h4>Papel estratégico</h4><div class="vt-role f-'+esc(x.funil||"")+'"><b>'+esc(fu[0])+'</b>, '+esc(fu[1])+'.</div>'+(x.proposito||x.objetivo?'<p>'+esc(x.proposito||x.objetivo)+'</p>':'')+'</section>'+
        '<section id="'+id+'-stories"><h4>Sequência de Stories</h4><ol class="vt-story">'+sq.passos.map(function(p){return '<li><span class="vt-t">'+esc(p.t)+'</span><div><b>'+esc(p.papel)+'</b>'+(p.fase?' <span class="vt-soft">· '+esc(p.fase)+'</span>':'')+'<div>'+esc(p.fala)+'</div>'+(p.visual||p.inter?'<div class="vt-soft">'+esc([p.visual?"Mostrar: "+p.visual:"",p.inter?"Interação: "+p.inter:""].filter(Boolean).join(" · "))+'</div>':'')+'</div></li>'}).join('')+'</ol>'+(sq.sug?'<p class="vt-soft">Sequência sugerida, os primeiros Stories despertam curiosidade para o post, sem pressa nem urgência.</p>':'')+'</section>'+
        '<div class="vt-actions"><button class="vt-btn ok" data-vt-ok>Aprovar pauta</button><button class="vt-btn" data-vt-adj>Pedir ajuste</button></div>'+
        '<div class="vt-adjbox" hidden><textarea placeholder="O que você gostaria de ajustar nesta pauta?">'+esc(it.clientNote||"")+'</textarea><button class="vt-btn ok" data-vt-send>Enviar ajuste</button></div>'+
        (it.clientStatus==="ajuste"&&it.clientNote?'<p class="vt-soft">Seu pedido: “'+esc(it.clientNote)+'”</p>':'')+
        '</div></details>';
    });
    if(!ord.length)h+='<p class="vt-soft" style="text-align:center;padding:30px 0">O calendário ainda está sendo montado.</p>';
    return h+'</div>';
  }
  var VT_CSS='.vt{max-width:640px;margin:0 auto;color:var(--ink,#191826);font-size:15px;line-height:1.5}'+
    '.vt-hero{position:relative;background:linear-gradient(160deg,var(--brand-weak,#EEEBFF),var(--surface,#fff) 70%);border:1px solid var(--line,#E8E8F1);border-radius:20px;padding:22px 18px 18px;margin-bottom:14px}'+
    '.vt-emoji{font-size:34px;line-height:1;margin-bottom:10px}.vt-kicker{font-size:12.5px;font-weight:600;color:var(--brand-ink,#4634B6);text-transform:uppercase;letter-spacing:.05em}'+
    '.vt-title{font-size:23px;line-height:1.2;margin:4px 0 8px;font-weight:800}.vt-meta{display:flex;flex-wrap:wrap;gap:6px 12px;font-size:13px;color:var(--muted,#6A6A7E);margin-bottom:12px}'+
    '.vt-msg{margin:0 0 14px;font-size:15px;color:var(--ink,#191826)}.vt-prog{display:flex;align-items:center;gap:10px;font-size:12.5px;color:var(--muted,#6A6A7E)}.vt-bar{flex:1;height:6px;border-radius:9px;background:var(--line,#E8E8F1);overflow:hidden}.vt-bar i{display:block;height:100%;background:#1E8A5B}'+
    '.vt-edit{position:absolute;top:12px;right:12px;font:inherit;font-size:12px;border:1px solid var(--line,#E8E8F1);background:var(--surface,#fff);color:var(--ink,#191826);border-radius:9px;padding:5px 9px;cursor:pointer}'+
    '.vt-legend{font-size:13px;color:var(--muted,#6A6A7E);margin:0 4px 6px}.vt-week{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#6A6A7E);margin:18px 4px 8px}'+
    '.vt-p{background:var(--surface,#fff);border:1px solid var(--line,#E8E8F1);border-radius:16px;margin-bottom:10px;overflow:hidden}.vt-p[open]{box-shadow:0 10px 28px -18px rgba(20,19,32,.35)}'+
    '.vt-p summary{list-style:none;display:flex;gap:12px;align-items:center;padding:13px 14px;cursor:pointer}.vt-p summary::-webkit-details-marker{display:none}'+
    '.vt-when{flex:0 0 56px;text-align:center;border-radius:12px;background:var(--brand-weak,#EEEBFF);padding:6px 4px;display:flex;flex-direction:column;line-height:1.15}.vt-when b{font-size:12px;color:var(--brand-ink,#4634B6)}.vt-when span{font-size:12px;color:var(--muted,#6A6A7E)}.vt-when em{font-style:normal;font-weight:800;font-size:14px;margin-top:2px}'+
    '.vt-sum{flex:1;min-width:0}.vt-chips{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:4px}.vt-chip,.vt-st{font-size:11.5px;font-weight:600;border-radius:999px;padding:2px 8px;background:var(--surface-2,#FBFBFE);border:1px solid var(--line,#E8E8F1)}'+
    '.f-topo{color:#2E6FB7}.f-meio{color:#A9741A}.f-fundo{color:#1E8A5B}.vt-st.ok{color:#1E8A5B;background:#E4F5EC;border-color:transparent}.vt-st.adj{color:#A9741A;background:#FBF0DB;border-color:transparent}'+
    '.vt-hd{font-weight:700;font-size:15px;line-height:1.3}.vt-arrow{font-size:22px;color:var(--muted,#6A6A7E);transition:transform .15s}.vt-p[open] .vt-arrow{transform:rotate(90deg)}'+
    '.vt-body{padding:0 14px 16px;border-top:1px solid var(--line,#E8E8F1)}.vt-jump{position:sticky;top:0;display:flex;gap:6px;padding:10px 0;background:var(--surface,#fff);z-index:1}.vt-jump a{flex:1;text-align:center;font-size:12.5px;font-weight:600;text-decoration:none;color:var(--brand-ink,#4634B6);background:var(--brand-weak,#EEEBFF);border-radius:10px;padding:7px 4px}'+
    '.vt-body section{padding:10px 0;border-bottom:1px dashed var(--line,#E8E8F1);scroll-margin-top:52px}.vt-body h4{margin:0 0 6px;font-size:11.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--muted,#6A6A7E)}.vt-body p{margin:6px 0 0}'+
    '.vt-tag{display:inline-block;font-size:12px;font-weight:600;color:var(--brand-ink,#4634B6);margin-bottom:4px}.vt-big{font-size:18px;font-weight:800;line-height:1.3}'+
    '.vt-copy{white-space:pre-wrap;background:var(--brand-weak,#EEEBFF);border-radius:12px;padding:12px 13px;font-size:14.5px}.vt-btn{font:inherit;font-size:13.5px;font-weight:600;border:1px solid var(--line,#E8E8F1);background:var(--surface,#fff);color:var(--ink,#191826);border-radius:11px;padding:9px 13px;margin-top:8px;cursor:pointer}.vt-btn.ok{background:var(--brand,#5B45E6);border-color:var(--brand,#5B45E6);color:#fff}'+
    '.vt-steps,.vt-story{margin:0;padding:0;list-style:none}.vt-steps li{padding:7px 0 7px 12px;border-left:3px solid var(--brand,#5B45E6);margin-bottom:6px}.vt-steps li div{margin-top:2px}'+
    '.vt-story li{display:flex;gap:10px;padding:7px 0}.vt-t{flex:0 0 54px;font-weight:800;font-size:13px;color:#0E8C9B}.vt-fmt div{margin-top:3px}.vt-role{font-size:14.5px}'+
    '.vt-soft{font-size:12.5px;color:var(--muted,#6A6A7E)}.vt-actions{display:flex;gap:8px;flex-wrap:wrap;padding-top:6px}.vt-adjbox textarea{width:100%;min-height:80px;border:1px solid var(--line,#E8E8F1);border-radius:10px;padding:10px;font:inherit;margin-top:8px;background:var(--surface-2,#FBFBFE);color:var(--ink,#191826)}'+
    '.vt-strat{background:var(--surface,#fff);border:1px solid var(--line,#E8E8F1);border-radius:16px;padding:12px 14px;margin:14px 0}.vt-strat summary{cursor:pointer;font-weight:700}';
  (function(){try{var st=document.createElement("style");st.textContent=VT_CSS;document.head.appendChild(st);}catch(e){}})();
  // Comportamento no ARQUIVO enviado ao cliente: copiar, aprovar e pedir ajuste (vai para o WhatsApp/e-mail do estrategista).
  function vtFileScript(D){
    var KEY="vt_status_"+D.cliente;
    function load(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")||{}}catch(e){return {}}}
    function save(o){try{localStorage.setItem(KEY,JSON.stringify(o))}catch(e){}}
    function send(txt,item,st){txt=txt+"\n\nref: CAL|"+D.cid+"|"+item+"|"+st;
      if(D.mail){window.location.href="mailto:"+D.mail+"?subject="+encodeURIComponent("Retorno de pauta, "+D.cliente)+"&body="+encodeURIComponent(txt);return true}
      if(D.wa){window.open("https://wa.me/"+D.wa+"?text="+encodeURIComponent(txt),"_blank");return true}return false}
    function mark(p,st,note){var o=load();o[p.getAttribute("data-vt-item")]={st:st,note:note||""};save(o);paint()}
    function paint(){var o=load(),n=0,tot=0;[].forEach.call(document.querySelectorAll(".vt-p"),function(p){tot++;var s=o[p.getAttribute("data-vt-item")]||(p.getAttribute("data-vt-status")?{st:p.getAttribute("data-vt-status")}:null),ch=p.querySelector(".vt-chips"),old=ch.querySelector(".vt-st");if(old)old.remove();
      if(s){if(s.st==="aprovado")n++;var b=document.createElement("span");b.className="vt-st "+(s.st==="aprovado"?"ok":"adj");b.textContent=s.st==="aprovado"?"Aprovada":"Ajuste pedido";ch.appendChild(b)}});
      var pg=document.querySelector("[data-vt-prog]");if(pg)pg.textContent=n+" de "+tot+" pautas aprovadas";var bar=document.querySelector(".vt-bar i");if(bar)bar.style.width=(tot?Math.round(n*100/tot):0)+"%"}
    document.addEventListener("click",function(e){var t=e.target.closest&&e.target.closest("[data-vt-copy],[data-vt-ok],[data-vt-adj],[data-vt-send]");if(!t)return;var p=t.closest(".vt-p");
      if(t.hasAttribute("data-vt-copy")){var el=document.getElementById(t.getAttribute("data-vt-copy")),txt=el?el.innerText:"";var done=function(){t.textContent="Copiado";setTimeout(function(){t.textContent="📋 Copiar texto"},1600)};
        if(navigator.clipboard)navigator.clipboard.writeText(txt).then(done,function(){var r=document.createRange();r.selectNodeContents(el);var s=getSelection();s.removeAllRanges();s.addRange(r);document.execCommand("copy");done()});else{var r=document.createRange();r.selectNodeContents(el);var s=getSelection();s.removeAllRanges();s.addRange(r);document.execCommand("copy");done()}return}
      if(t.hasAttribute("data-vt-ok")){mark(p,"aprovado");send("Aprovado, pauta de "+p.getAttribute("data-vt-label"),p.getAttribute("data-vt-item"),"aprovado");return}
      if(t.hasAttribute("data-vt-adj")){var bx=p.querySelector(".vt-adjbox");bx.hidden=!bx.hidden;if(!bx.hidden)bx.querySelector("textarea").focus();return}
      if(t.hasAttribute("data-vt-send")){var tx=p.querySelector(".vt-adjbox textarea").value.trim();if(!tx){p.querySelector(".vt-adjbox textarea").focus();return}mark(p,"ajuste",tx);p.querySelector(".vt-adjbox").hidden=true;
        if(!send("Ajuste na pauta de "+p.getAttribute("data-vt-label")+":\n"+tx,p.getAttribute("data-vt-item"),"ajuste"))alert("Ajuste registrado. Envie este texto ao seu estrategista:\n\n"+tx)}});
    paint();
  }
  function buildVitrineDoc(items,r,cliente){
    var cfg=formCfg(),wa=String(cfg.whats||"").replace(/\D/g,"");if(wa&&wa.length<=11)wa="55"+wa;
    var D=JSON.stringify({cliente:cliente,cid:state.client,wa:wa,mail:String(cfg.email||"").trim()}).replace(/</g,"\\u003c");
    var estr=planoClienteHtml(items,r),S='scr'+'ipt';
    var root=':root{--bg:#F5F5FA;--surface:#fff;--surface-2:#FBFBFE;--ink:#191826;--muted:#6A6A7E;--line:#E8E8F1;--brand:#5B45E6;--brand-ink:#4634B6;--brand-weak:#EEEBFF}@media (prefers-color-scheme:dark){:root{--bg:#0E0D16;--surface:#16141F;--surface-2:#1B1927;--ink:#ECEBF5;--muted:#A3A1B7;--line:#2A2838;--brand:#8B7BFF;--brand-ink:#A99CFF;--brand-weak:#241F3B}}*{box-sizing:border-box}body{margin:0;background:var(--bg);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:16px 14px 50px}.vt-strat h2{font-size:15px;margin:12px 0 6px}.vt-strat section{margin-top:6px}.vt-strat .m{color:var(--muted);font-size:13px}.vt-strat .big{font-weight:700;color:var(--brand-ink)}';
    return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc((vitrineOf(state.client).titulo||"Calendário de conteúdo")+", "+cliente)+'</title><style>'+root+VT_CSS+'</style></head><body>'+
      vitrineHtml(items,"arquivo").replace(/<\/div>$/,'')+'<details class="vt-strat"><summary>Estratégia e linha editorial do período</summary>'+estr+'</details></div>'+
      '<'+S+'>('+vtFileScript.toString()+')('+D+');</'+S+'></body></html>';
  }
  // Comportamento no PAINEL ("Ver como cliente"): aprovações e ajustes gravados no banco; topo editável.
  function wireVitrine(root){
    if(root.__vtWired)return;root.__vtWired=true;
    root.addEventListener('click',function(e){if(!state.clientView)return;var items=(GENERATED&&GENERATED.calendar&&GENERATED.calendar.items)||[];var t=e.target.closest&&e.target.closest("[data-vt-copy],[data-vt-ok],[data-vt-adj],[data-vt-send],[data-vt-edit]");if(!t)return;
      if(t.hasAttribute("data-vt-edit")){abrirEdicaoTopo();return;}
      var p=t.closest(".vt-p"),itId=p&&p.getAttribute("data-vt-item"),it=items.filter(function(x){return x.id===itId})[0];
      if(t.hasAttribute("data-vt-copy")){var el=I("#"+t.getAttribute("data-vt-copy")),txt=el?el.textContent:"";var ok=function(){t.textContent="Copiado";setTimeout(function(){t.textContent="📋 Copiar texto"},1600)};if(navigator.clipboard)navigator.clipboard.writeText(txt).then(ok,ok);else ok();return;}
      if(!it)return;
      function salvar(patch,aviso){dbItemsCol("cos_calendar",state.client).doc(it.id).update(patch).then(function(){Object.assign(it,patch);toast(aviso);var aberto=p.id;renderCal();var np=I("#"+aberto);if(np)np.open=true;},function(){toast("Não consegui salvar agora, tente de novo.");});}
      if(t.hasAttribute("data-vt-ok")){salvar({clientStatus:"aprovado",clientAt:new Date().toISOString()},"Pauta aprovada ✓");return;}
      if(t.hasAttribute("data-vt-adj")){var bx=p.querySelector(".vt-adjbox");bx.hidden=!bx.hidden;if(!bx.hidden)bx.querySelector("textarea").focus();return;}
      if(t.hasAttribute("data-vt-send")){var tx=p.querySelector(".vt-adjbox textarea").value.trim();if(!tx)return;salvar({clientStatus:"ajuste",clientNote:tx,clientAt:new Date().toISOString()},"Pedido de ajuste registrado");}
    });
  }
  function abrirEdicaoTopo(){
    var id=state.client,v=vitrineOf(id);
    I("#overlay").innerHTML='<div class="scrim" id="scrim"></div><aside class="drawer" role="dialog" style="width:min(480px,100%)"><div class="dh"><div class="d-title">Topo do calendário do cliente</div><button class="icon-btn" id="dclose">✕</button></div><div class="db"><div class="block">'+
      '<div class="grid" style="grid-template-columns:80px 1fr;gap:12px"><div class="fld"><label for="vtEmoji">Emoji</label><input id="vtEmoji" value="'+esc(v.emoji||emojiDoCliente())+'" maxlength="4" style="font-size:22px;text-align:center"></div><div class="fld"><label for="vtTitulo">Título</label><input id="vtTitulo" value="'+esc(v.titulo||"Seu calendário de conteúdo")+'"></div></div>'+
      '<div class="fld"><label for="vtMsg">Mensagem da direção estratégica (curta, sem prometer resultados)</label><textarea class="ta" id="vtMsg" style="min-height:130px">'+esc(v.mensagem||mensagemPadrao())+'</textarea></div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn pri" id="vtSave">Salvar</button><button class="btn" id="vtAi">Escrever com IA a partir do briefing</button><span id="vtMsgSt" style="font-size:12px;color:var(--muted)"></span></div></div></div></aside>';
    I("#scrim").addEventListener('click',closeDrawer);I("#dclose").addEventListener('click',closeDrawer);document.addEventListener('keydown',escClose);
    I("#vtAi").addEventListener('click',async function(){if(!CAP.sample){noAi();return;}var st=I("#vtMsgSt");setBusy(st,"Escrevendo…");try{I("#vtMsg").value=await gerarMensagemVitrine();clearBusy(st);st.textContent="Pronto, ajuste se quiser e salve.";}catch(e){clearBusy(st);st.textContent=sampleErrCopy(e);}});
    I("#vtSave").addEventListener('click',function(){var rec=DB_CLIENTS[id];if(!rec)return;var vt={emoji:I("#vtEmoji").value.trim()||emojiDoCliente(),titulo:I("#vtTitulo").value.trim(),mensagem:I("#vtMsg").value.trim()};
      saveClientRecord(id,Object.assign({},rec,{vitrine:vt})).then(function(){closeDrawer();toast("Topo atualizado");renderCal();},function(){I("#vtMsgSt").textContent="Não consegui salvar";});});
  }
  async function gerarMensagemVitrine(){
    var id=state.client,c=DB_CLIENTS[id]||{},st=(GENERATED||{}).strategy||{};
    var out=await CAP.sample.json(['Você escreve a mensagem de abertura do calendário de conteúdo que um estrategista envia ao cliente.',
      'Escreva 2 a 3 frases curtas, em português do Brasil, falando direto com o cliente (você), explicando a direção estratégica deste período de forma inspiradora e profissional.',
      'NUNCA prometa resultados, números, seguidores ou vendas. Sem clichês de IA, sem exageros, sem urgência. Use o tom de voz do cliente.',
      '', 'Cliente: '+clientName(id)+(c.niche?', '+c.niche:''), 'Briefing: '+String(c.briefing||'').slice(0,2500),
      'Estratégia: posicionamento '+(st.posicionamento||'')+' | Big Message '+(st.bigMessage||'')+' | pilares '+(st.pilares||[]).join(', '),
      metasPrompt(), capacidadePrompt(), '', 'Responda SOMENTE com JSON: {"mensagem":string}'].filter(Boolean).join('\n'),{modelTier:"default",cache:false});
    return String((out&&out.mensagem)||"").trim()||mensagemPadrao();
  }
  // ---------- Google Agenda (conector): cria os horários de publicação com a pauta completa na descrição ----------
  function gcalErr(e){var c=e&&e.code;
    if(c==="no_mcp"||c==="not_granted"||c==="capability_disabled"||c==="capability_removed")return "A Google Agenda só funciona no painel aberto pelo link, no claude.ai.";
    if(c==="needs_reauth")return "Reconecte a Google Agenda em claude.ai, Configurações, Conectores.";
    if(c==="server_not_connected"||c==="server_not_found")return "Adicione o conector Google Calendar em claude.ai, Configurações, Conectores.";
    if(c==="not_in_manifest")return "O painel não tem permissão para usar a Google Agenda, recarregue e permita quando o Claude perguntar.";
    if(c==="server_unavailable")return "A Google Agenda não respondeu agora, tente de novo em instantes.";
    return "Não consegui criar os eventos agora"+(c?" ("+c+")":"")+".";}
  function gcalDescricao(it,r){var x=it.idea||{},f=vtFormato(x),fu=FUNIL_TXT[x.funil]||["",""],tx=vtTexto(it),ro=vtRoteiro(it),sq=vtStories(it,r),L=[];
    L.push("<b>"+esc(pecaTitulo(it))+"</b>");L.push("Formato: "+esc(f.sup+(f.nome?" · "+f.nome:""))+" | Papel: "+esc(fu[0]+", "+fu[1]));
    if(x.proposito||x.objetivo)L.push("Objetivo: "+esc(x.proposito||x.objetivo));
    if(tx)L.push("<br><b>Texto pronto</b><br>"+esc(tx).replace(/\n/g,"<br>"));
    if(ro.passos.length)L.push("<br><b>Como produzir</b><br>"+ro.passos.map(function(p){return "• "+esc(p.k)+": "+esc(p.v)}).join("<br>"));
    L.push("<br><b>Stories</b><br>"+sq.passos.map(function(p){return esc(p.t)+" · "+esc(p.papel)+": "+esc(p.fala)}).join("<br>"));
    L.push("<br>Pauta completa no calendário de conteúdo que você recebeu.");
    return L.join("<br>");}
  function openGcalModal(items){
    var r=rotinaOf(state.client),pend=items.filter(function(it){return isIsoDate(it.data)&&!it.gcal});
    I("#overlay").innerHTML='<div class="scrim" id="scrim"></div><aside class="drawer" role="dialog" style="width:min(460px,100%)"><div class="dh"><div class="d-title">Enviar para a Google Agenda</div><button class="icon-btn" id="dclose">✕</button></div><div class="db"><div class="block">'+
      '<div style="font-size:12.5px;color:var(--muted);margin-bottom:12px">Cria <b>'+pend.length+' evento(s)</b> na sua Google Agenda, no dia e horário de cada publicação, com lembrete 30 min antes e a pauta completa na descrição (texto pronto, roteiro e Stories).'+(items.length-pend.length?' '+(items.length-pend.length)+' já foram enviados antes e ficam como estão.':'')+'</div>'+
      '<div class="fld"><label for="gcEmail">E-mail do cliente para convidar (opcional)</label><input id="gcEmail" placeholder="cliente@email.com"></div>'+
      '<div style="font-size:11.5px;color:var(--faint);margin:-4px 0 12px">Com o e-mail, os eventos aparecem também na agenda do cliente (ele recebe o convite). Sem e-mail, ficam só na sua.</div>'+
      '<button class="btn pri genbtn" id="gcGo"'+(pend.length?'':' disabled')+'>📆 Criar '+pend.length+' evento(s)</button><span id="gcMsg" style="margin-left:10px;font-size:12px;color:var(--muted)"></span></div></div></aside>';
    I("#scrim").addEventListener('click',closeDrawer);I("#dclose").addEventListener('click',closeDrawer);document.addEventListener('keydown',escClose);
    I("#gcGo").addEventListener('click',async function(){
      var email=I("#gcEmail").value.trim(),btn=I("#gcGo"),m=I("#gcMsg"),feitos=0;btn.disabled=true;
      if(email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){m.textContent="E-mail inválido.";m.style.color="var(--warn)";btn.disabled=false;return;}
      var mcp=null;try{mcp=window.claude&&claude.use?await claude.use("mcp"):null;}catch(e){}
      if(!mcp){m.textContent=gcalErr({code:"no_mcp"});m.style.color="var(--warn)";btn.disabled=false;return;}
      for(var i=0;i<pend.length;i++){var it=pend[i],x=it.idea||{},h=itemHora(it,r),ini=it.data+"T"+h+":00",fimD=parseD(it.data),hp=h.split(":");fimD.setHours(+hp[0],+hp[1]+30,0,0);
        var fim=fmtD(fimD)+"T"+("0"+fimD.getHours()).slice(-2)+":"+("0"+fimD.getMinutes()).slice(-2)+":00";
        setBusy(m,"Criando "+(i+1)+" de "+pend.length+"…");
        var input={summary:surfIc(x.surface)+" "+surfLbl(x.surface)+": "+pecaTitulo(it)+", "+clientName(state.client),startTime:ini,endTime:fim,timeZone:"America/Sao_Paulo",description:gcalDescricao(it,r),overrideReminders:[{method:"popup",minutes:30}]};
        if(email)input.attendees=[{email:email}];
        try{var res=await mcp.callTool("Google Calendar","create_event",input,{cache:false}),pl=res&&res.payload,evId=(pl&&(pl.id||pl.eventId))||"ok";
          await dbItemsCol("cos_calendar",state.client).doc(it.id).update({gcal:String(evId)});it.gcal=String(evId);feitos++;}
        catch(e){clearBusy(m);m.textContent=gcalErr(e)+(feitos?" ("+feitos+" criado(s) antes do erro)":"");m.style.color="var(--warn)";btn.disabled=false;return;}
      }
      clearBusy(m);m.textContent=""+feitos+" evento(s) criados na sua Google Agenda"+(email?" e enviados como convite":"");m.style.color="var(--good)";
    });
  }
  // Tabela de peças (Lista do calendário, Aprovações, Próximas publicações do Hoje).
  var ST_CHIP={"PLANNED":"","IN PRODUCTION":"prog","REVIEW":"warn","WAITING APPROVAL":"prog","APPROVED":"act","SCHEDULED":"act","PUBLISHED":"act"};
  function pecasTabelaHtml(linhas,vazio){
    if(!linhas.length)return '<div class="vazio">'+esc(vazio||"Nenhuma peça.")+'</div>';
    return '<div class="tabela"><table><thead><tr><th>Data</th><th>Peça</th><th>Formato</th><th>Funil</th><th>Status</th><th></th></tr></thead><tbody>'+
      linhas.map(function(o){var it=o.it,x=it.idea||{};
        return '<tr data-gen="'+o.i+'"><td class="nowrap">'+esc(quando(it))+'</td><td><b class="cel-t">'+esc(pecaTitulo(it))+'</b>'+(isRascunho(it.content)?'<small>rascunho escrito sem IA</small>':!pecaPronta(it)?'<small>sem texto ainda</small>':'')+'</td>'+
          '<td>'+esc(surfLbl(x.surface))+'<small>'+esc(x.format||"")+'</small></td><td><span class="chip">'+esc(x.funil||"")+'</span></td>'+
          '<td><span class="chip '+(ST_CHIP[it.status]||"")+'">'+esc(stLabel(it.status))+'</span>'+(it.clientStatus==="aprovado"?'<small>cliente aprovou</small>':it.clientStatus==="ajuste"?'<small>cliente pediu ajuste</small>':'')+'</td>'+
          '<td class="acao"><span class="btn">Abrir</span></td></tr>';}).join('')+'</tbody></table></div>';
  }
  function calListHtml(items){return pecasTabelaHtml(items.map(function(it,i){return {it:it,i:i}}),"Nenhuma peça no calendário.");}
  function periodSelectorHtml(){
    var cur=state.period||30,dias=diasPostOf(),nSlots=slotsFor(cur,dias).length,nIdeas=(GENERATED.ideas||[]).length;
    var sty=function(on){return on?'background:var(--brand-weak);color:var(--brand-ink);border-color:transparent':''};
    return '<div><div class="bt">Período e frequência</div>'+
      '<div class="plrow"><span class="pllbl">Período</span>'+[30,45,60,90].map(function(d){return '<button class="preset periodBtn" data-days="'+d+'" style="'+sty(cur===d)+'">'+d+' dias</button>'}).join('')+'</div>'+
      '<div class="plrow"><span class="pllbl">Conteúdos por semana</span>'+[[3,"3 por semana"],[4,"4 por semana"],[5,"5 por semana"],[7,"7 por semana (todo dia)"]].map(function(p){return '<button class="preset ppwBtn" data-n="'+p[0]+'" style="'+sty(dias.length===p[0])+'">'+p[1]+'</button>'}).join('')+
        '<span style="font-size:11.5px;color:var(--faint);margin-left:4px">outro:</span>'+[1,2,6].map(function(n){return '<button class="preset ppwBtn" data-n="'+n+'" style="padding:4px 9px;'+sty(dias.length===n)+'">'+n+'</button>'}).join('')+'</div>'+
      '<div class="plrow"><span class="pllbl">Dias de postagem</span>'+[1,2,3,4,5,6,0].map(function(i){return '<button class="preset diaBtn" data-dia="'+i+'" style="'+sty(dias.indexOf(i)>=0)+'">'+DIAS_SEM[i]+'</button>'}).join('')+'</div>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:12px;padding-top:12px;border-top:1px solid var(--line)"><div style="font-size:13px"><b>'+nSlots+' postagens</b> em '+cur+' dias · '+dias.length+' por semana'+(capOf(state.client)?' · até '+capOf(state.client).grav+' gravada(s)/semana':'')+(nIdeas&&nIdeas<nSlots?' <span style="color:var(--muted)">· você tem '+nIdeas+' ideias, o painel cria as '+(nSlots-nIdeas)+' que faltam, sem repetir</span>':'')+'</div>'+
      '<button class="btn pri genbtn" id="genPlanBtn" style="margin-left:auto">Montar calendário</button><span id="planMsg" style="font-size:12px;color:var(--muted)"></span></div>'+
      '<div class="pp-m" style="margin-top:8px">Montar de novo substitui o calendário atual deste cliente.</div></div>';
  }
  function calToolbarHtml(temItens){
    return '<div class="toolbar">'+(temItens?'<div class="subtabs"><button class="sub calMode'+(state.calMode!=="lista"?' on':'')+'" data-mode="agenda">Semana</button><button class="sub calMode'+(state.calMode==="lista"?' on':'')+'" data-mode="lista">Lista</button></div>':'')+
      '<span class="spacer"></span><button class="btn" id="calCfgOpen"><span class="bi">'+iconeUI("settings")+'</span>Rotina e período</button>'+
      (temItens?'<button class="btn" id="expIcs" title="Importa no Google Agenda ou no celular, com lembrete 30 min antes">Baixar agenda</button><button class="btn" id="expHtml" title="Arquivo para enviar ao cliente: abre no celular, com roteiro, Stories e aprovação por pauta">Arquivo para o cliente</button><button class="btn" id="expGcal">Google Agenda</button>':'')+
      '</div><div id="expMsg" class="pp-m" style="min-height:18px;margin:-8px 0 12px"></div>';
  }
  // Gaveta "Rotina e período": configuração que se mexe pouco sai da frente do calendário.
  function openCalConfig(){state.calCfgAberta=true;renderCalConfig();}
  function fecharCalConfig(){state.calCfgAberta=false;closeDrawer();}
  function renderCalConfig(){
    var form=rotinaCardHtml().replace(/<details class="card pad"[^>]*>/,'<details class="rotina-dobra" open>');
    I("#overlay").innerHTML='<div class="scrim" id="scrim"></div><aside class="drawer" role="dialog" aria-label="Rotina e período"><div class="dh"><div style="flex:1;min-width:0"><div class="d-title">Rotina e período</div><div class="d-sub">'+esc(clientName(state.client))+'</div></div><button class="icon-btn" id="dclose" aria-label="Fechar">'+iconeUI("x-fechar")+'</button></div>'+
      '<div class="db"><div class="block">'+periodSelectorHtml()+'</div><div class="block">'+form+'</div></div></aside>';
    I("#scrim").addEventListener('click',fecharCalConfig);I("#dclose").addEventListener('click',fecharCalConfig);
    var dw=I("#overlay .drawer");
    Array.prototype.forEach.call(dw.querySelectorAll('.periodBtn'),function(b){b.addEventListener('click',function(){state.period=+b.getAttribute('data-days');renderCal();})});
    function setDias(d){state.diasPost=d.slice().sort();state.diasPostCli=state.client;renderCal();}
    Array.prototype.forEach.call(dw.querySelectorAll('.ppwBtn'),function(b){b.addEventListener('click',function(){setDias(DIAS_PADRAO[+b.getAttribute('data-n')]);})});
    Array.prototype.forEach.call(dw.querySelectorAll('.diaBtn'),function(b){b.addEventListener('click',function(){var d=diasPostOf(),v=+b.getAttribute('data-dia'),i=d.indexOf(v);if(i>=0)d.splice(i,1);else d.push(v);setDias(d);})});
    var gp=I("#genPlanBtn");if(gp)gp.addEventListener('click',function(){runGerarPlanejamento(state.period||30).then(function(){if((GENERATED.calendar.items||[]).length)fecharCalConfig();});});
    wireRotina();
  }
  function renderCal(){
    var col={Reel:"#5B45E6",Carrossel:"#2E6FB7",Stories:"#0E8C9B"};
    if(isDbClient(state.client)&&state.clientView){
      var elv=I('.view[data-view="calendar"]'),itv=(GENERATED.calendar&&GENERATED.calendar.items)||[];
      elv.innerHTML=vitrineHtml(itv,"painel");wireVitrine(elv);return;
    }
    if(isDbClient(state.client)){
      var el=I('.view[data-view="calendar"]');
      var items=(GENERATED.calendar&&GENERATED.calendar.items)||[];
      var hasIdeas=GENERATED.ideas&&GENERATED.ideas.length;
      var h=calToolbarHtml(items.length);
      h+=items.length?(state.calMode==="lista"?calListHtml(items):agendaHtml(items)):
        '<div class="card empty-hero"><div class="eh-t"><b>'+(hasIdeas?'O calendário ainda não foi montado.':'Faltam as ideias.')+'</b>'+(hasIdeas?'Escolha o período e os dias de postagem, e o Cronos distribui as ideias nas datas.':'O calendário distribui as ideias aprovadas nas datas. Gere as ideias primeiro.')+'</div>'+
        (hasIdeas?'<button class="btn pri" id="calCfgOpen2" style="margin-top:16px">Montar calendário</button>':'<button class="btn pri" data-ir-aba="ideas" style="margin-top:16px">Ir para Ideias</button>')+'</div>';
      el.innerHTML=h;
      Array.prototype.forEach.call(el.querySelectorAll('#calCfgOpen,#calCfgOpen2'),function(b){b.addEventListener('click',openCalConfig)});
      var ia=el.querySelector('[data-ir-aba]');if(ia)ia.addEventListener('click',function(){go(ia.getAttribute('data-ir-aba'))});
      if(items.length){wireGen('.view[data-view="calendar"] [data-gen]');wireCalExtras(items);}
      if(state.calCfgAberta)renderCalConfig();
      return;
    }
    if(genOn()){
      // Calendário editorial premium: 4 semanas, a partir do plano REAL do cliente.
      var items=GENERATED.calendar.items,dias=["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
      var head=dias.map(function(d){return '<div style="font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--faint);text-align:center;padding:2px 0">'+d+'</div>'}).join('');
      var cells='';
      for(var day=0;day<28;day++){
        var it=null,idx=-1;
        // distribui os conteúdos ~2/semana em dias úteis (seg/qua/sex)
        items.forEach(function(x,i){var target=Math.floor(i/3)*7+[0,2,4][i%3];if(target===day){it=x;idx=i;}});
        var num=day+1;
        cells+='<div class="calcell">'+'<div class="calnum">'+num+'</div>'+(it?('<div class="calev" data-gen="'+idx+'" style="border-left:3px solid '+(col[it.idea.surface]||"#575663")+'"><div class="calev-h">'+esc(it.content.headline)+'</div><div class="calev-m">'+esc(it.idea.surface)+' · '+esc(it.idea.funcao)+'</div></div>'):'')+'</div>';
      }
      I("#cal").innerHTML='<div class="calgridw">'+head+cells+'</div>';
      wireGen('#cal [data-gen]');
      return;
    }
    var days=["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
    var map={0:[],1:[],2:[],3:[],4:[],5:[],6:[]},didx={"Seg":0,"Ter":1,"Qua":2,"Qui":3,"Sex":4,"Sáb":5,"Dom":6};
    CONTENT.forEach(function(x){var d=didx[x.date.split(" ")[0]];if(d!=null)map[d].push(x)});
    I("#cal").innerHTML=days.map(function(d,i){return '<div class="day"><div class="dn">'+d+'</div>'+map[i].map(function(x){return '<div class="ev" data-content="'+x.id+'" style="background:'+(col[x.surface]||"#575663")+'">'+esc(x.surface)+' · '+esc(x.format)+'</div>'}).join('')+'</div>'}).join('');
    wireContent('#cal [data-content]');
  }
  function renderKB(){I("#kbGrid").innerHTML=PILLARS.map(function(p){return '<div class="card kb-card"><div class="kb-t">'+esc(p.t)+'</div><div class="kb-d">'+esc(p.d)+'</div><div class="kb-m">'+p.m.map(function(m){return '<span class="badge">'+esc(m)+'</span>'}).join('')+'</div></div>'}).join('')}
  function renderAgents(){if(SB){renderAgentesServidor();return;}
    I("#agentGrid").innerHTML=quadro("Os agentes","Eles rodam sozinhos no painel publicado, com login da equipe. Aqui, a IA só roda quando você clica em Gerar.",'',
      '<div class="tabela"><table><thead><tr><th>Agente</th><th>Quando roda sozinho</th></tr></thead><tbody>'+AG_ORDEM.map(function(k){return '<tr class="sem-clique"><td><b class="cel-t">'+esc(AG_INFO[k][0])+'</b><small>'+esc(AG_INFO[k][1])+'</small></td><td>'+esc(AG_QUANDO[k])+'</td></tr>'}).join('')+'</tbody></table></div>');}

