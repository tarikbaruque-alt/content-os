  // ---- Novo cliente: cadastro em branco (sem exemplos, sem dados fictícios) ----
  // ---------- Formulário de briefing para o cliente (arquivo que você envia) + importação das respostas ----------
  var BRIEF_MARK="📋 BRIEFING DE CONTEÚDO";
  var BRIEF_FREQ=["3 por semana","4 por semana","5 por semana","7 por semana (todo dia)"];
  // Respostas curtas do formulário → opções da rotina do painel (TEMPO_OPC).
  var BRIEF_TEMPO={"Não gravo":"Não grava (só arte/carrossel)","30 min":"Até 30 min","1 hora":"1 hora","2 horas ou mais":"2 horas"};
  var BRIEF_TOM=["Leve e descontraído","Acolhedor","Técnico e direto","Inspirador"];
  var BRIEF_OBJ_FUNIL={"Ser mais conhecido":"Atrair gente nova que ainda não me conhece (topo)","Educar quem já me segue":"Aquecer e educar quem já me segue (meio)","Vender mais":"Transformar seguidores em clientes (fundo)"};
  // Briefing curto: 14 perguntas essenciais (≈ 5 min) + 7 opcionais. Cada pergunta (n) tem
  // um ou mais campos (sub); o rótulo de cada campo é o que vai na mensagem e o que a
  // importação reconhece — mude um rótulo e a leitura das respostas muda junto.
  var BRIEF_FORM=[
    {g:"Sobre você",n:1,l:"Seus dados",sub:[
      {k:"name",l:"Seu nome ou nome da marca",t:"text",req:1},
      {k:"instagram",l:"Instagram (@)",t:"text",ph:"@seuperfil"},
      {k:"whats",l:"WhatsApp com DDD",t:"text",ph:"Ex.: 21 99999-9999"},
      {k:"email",l:"E-mail",t:"text",ph:"voce@email.com"}]},
    {n:2,l:"O que você faz e qual serviço você mais quer vender?",sub:[
      {k:"niche",l:"Sua área de atuação",t:"text",req:1,ph:"Ex.: personal trainer, dentista, loja de roupas"},
      {k:"oferta",l:"O que você faz e qual serviço você mais quer vender",t:"area",req:1,ph:"1 ou 2 frases"}]},
    {n:3,l:"Onde você atende?",sub:[
      {k:"atende",l:"Tipo de atendimento",t:"choice",req:1,opts:["Presencial","Online","Os dois"]},
      {k:"regiao",l:"Cidade / bairro",t:"text",ph:"Ex.: Tijuca, Rio de Janeiro"}]},
    {g:"Sobre o seu cliente",n:4,l:"Quem é o seu cliente ideal?",sub:[
      {k:"idade",l:"Idade do cliente ideal",t:"multi",req:1,hint:"Pode marcar mais de uma",opts:["Até 25","26 a 35","36 a 50","51 a 65","Mais de 65"]},
      {k:"genero",l:"Gênero do cliente ideal",t:"choice",opts:["Mulheres","Homens","Os dois"]},
      {k:"momento",l:"Em que momento ele está?",t:"area",req:1,ph:"Ex.: está voltando a treinar depois de anos parado; acabou de abrir o próprio negócio"}]},
    {n:5,sub:[{k:"dores",l:"Qual a maior dificuldade de quem te procura?",t:"area",req:1,ph:"1 frase"}]},
    {n:6,l:"O que faz a pessoa hesitar antes de fechar com você?",sub:[
      {k:"hesita",l:"O que faz a pessoa hesitar antes de fechar com você",t:"multi",req:1,hint:"Pode marcar mais de uma",opts:["Preço","Medo de não ter resultado","Falta de tempo","Ainda não conhece meu trabalho"]},
      {k:"hesita_outro",l:"Outro motivo",t:"text",ph:"Opcional"}]},
    {n:7,l:"Escreva as 3 perguntas que você mais ouve dos clientes",sub:[
      {k:"pergunta1",l:"Pergunta 1",t:"text",req:1},{k:"pergunta2",l:"Pergunta 2",t:"text"},{k:"pergunta3",l:"Pergunta 3",t:"text"}]},
    {g:"Sobre o seu jeito",n:8,sub:[{k:"diferencial",l:"Por que escolher você? Dê uma prova disso",t:"area",req:1,ph:"Anos de experiência, formação, um resultado, uma história de cliente"}]},
    {n:9,l:"Como você fala?",sub:[
      {k:"tom",l:"Como você fala",t:"multi",max:2,req:1,hint:"Marque até 2",opts:BRIEF_TOM},
      {k:"restricoes",l:"O que nunca pode aparecer no seu conteúdo?",t:"text"}]},
    {g:"Objetivos e rotina",n:10,sub:[{k:"objetivo",l:"O que você quer com o Instagram agora?",t:"multi",req:1,hint:"Pode marcar mais de um",opts:["Ser mais conhecido","Educar quem já me segue","Vender mais"]}]},
    {n:11,sub:[{k:"meta",l:"Qual é a sua principal meta para os próximos 3 meses?",t:"text",req:1,ph:"Ex.: fechar 5 clientes novos; chegar a 2 mil seguidores da minha região"}]},
    {n:12,sub:[{k:"frequencia",l:"Quantos posts por semana?",t:"choice",req:1,opts:BRIEF_FREQ}]},
    {n:13,l:"Quanto tempo você tem para gravar por semana?",sub:[
      {k:"tempo",l:"Tempo para gravar por semana",t:"choice",req:1,opts:Object.keys(BRIEF_TEMPO)},
      {k:"aparece",l:"Você aparece nos vídeos? (se grava)",t:"choice",opts:["À vontade","Às vezes","Prefiro não"]}]},
    {n:14,sub:[{k:"referencias",l:"Um perfil que você admira (e por quê) e um post seu que foi bem (se tiver)",t:"area"}]},
    {g:"Se quiser ir além",opt:1,n:15,l:"Conte a história de um cliente que te marcou",sub:[
      {k:"historia",l:"História de um cliente que te marcou",t:"area"},
      {k:"historia_uso",l:"Podemos usar essa história no conteúdo, sem o nome?",t:"choice",opts:["Sim","Não"]}]},
    {opt:1,n:16,sub:[{k:"processo",l:"Como é o primeiro atendimento com você, do começo ao fim?",t:"area"}]},
    {opt:1,n:17,sub:[{k:"formacao",l:"Qual formação ou curso mais mudou o seu jeito de trabalhar? Tem registro profissional?",t:"area",ph:"Ex.: CREF, CRN, OAB"}]},
    {opt:1,n:18,sub:[{k:"visual",l:"Você já tem logo, cores ou fotos que gosta de usar?",t:"choice",opts:["Sim, vou enviar","Ainda não"]}]},
    {opt:1,n:19,sub:[{k:"autoriz_imagem",l:"Tem autorização por escrito para mostrar clientes no conteúdo?",t:"choice",opts:["Sim","Não","Não sei"]}]},
    {opt:1,n:20,sub:[{k:"aprovacao",l:"Quem aprova o conteúdo, e em quanto tempo você costuma responder?",t:"text"}]},
    {opt:1,n:21,sub:[{k:"datas",l:"Alguma data importante nos próximos meses?",t:"text",ph:"Lançamento, aniversário do negócio, férias"}]}
  ];
  // Rótulos do formulário antigo (28 perguntas): só para continuar lendo briefings já enviados.
  var BRIEF_ANTIGO=[["name","Nome da empresa ou marca"],["responsavel","Seu nome (quem está preenchendo)"],["whats","Seu WhatsApp (com DDD)"],["niche","Área de atuação / nicho"],["instagram","Instagram (@)"],["site","Site ou link"],["regiao","Cidade / região de atendimento"],["oferta","O que você vende? (produtos e serviços principais)"],["ticket","Faixa de preço / ticket médio"],["publico","Quem é o seu cliente ideal?"],["dores","Quais são as maiores dores ou problemas dele?"],["desejos","O que ele mais deseja conquistar?"],["objecoes","O que faz ele hesitar antes de comprar?"],["proposito","Qual é o propósito da sua marca? (por que ela existe, além de vender)"],["identidade","Identidade: como quer ser percebido(a)? Valores, personalidade, estilo visual"],["diferencial","Por que escolher você e não outro?"],["provas","Provas: anos de experiência, nº de clientes, resultados, prêmios"],["tom","Como você gosta de falar? Palavras que usa e que evita"],["restricoes","O que NÃO pode aparecer no conteúdo?"],["objetivo","Objetivos com o Instagram (marque até 3)"],["funil","Neste momento, qual o foco principal?"],["frequencia","Quantos conteúdos por semana você quer?"],["tempo","Quanto tempo por semana você consegue reservar para gravar?"],["aparece","Você aparece nos vídeos?"],["gravdia","Melhor dia da semana para gravar"],["dias","Dias que prefere postar (pode marcar vários)"],["referencias","Perfis que você admira (referência) — e por quê"],["concorrentes","Concorrentes diretos"],["datas","Datas importantes, lançamentos ou campanhas"],["obs","Algo mais que devemos saber?"]];
  function formCfg(){try{return JSON.parse(localStorage.getItem("cos_form_cfg")||"{}")||{}}catch(e){return {}}}
  function saveFormCfg(o){try{localStorage.setItem("cos_form_cfg",JSON.stringify(o))}catch(e){}}
  // Roda no celular do cliente (arquivo baixado): monta o formulário a partir de D.
  // Autocontido de propósito — é serializado com toString() dentro do arquivo.
  function briefFormApp(D){
    var box=document.getElementById("form"),KEY="cos_briefing_v2",subs=[];
    // Formulário online único: o nome do cliente vem no fim do link (…#carol-pedrosa).
    if(!D.cliente){try{var hn=decodeURIComponent(location.hash.slice(1)).replace(/[-_.~]+/g," ").trim();
      if(hn&&hn.length<=40){hn=hn.replace(/(^|\s)\S/g,function(c){return c.toUpperCase()});document.getElementById("saud").textContent="Oi, "+hn+"!";document.getElementById("obg").textContent="Obrigado, "+hn+"!";KEY+="_"+hn.toLowerCase().replace(/\s+/g,"-");}}catch(e){}}
    D.form.forEach(function(q){q.sub.forEach(function(s){subs.push(s)})});
    function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]})}
    var h="",parte=0,partes=D.form.filter(function(q){return q.g}).length;
    D.form.forEach(function(q){
      if(q.g){parte++;h+=(parte>1?"</section>":"")+"<section class=\"sec"+(q.opt?" opt":"")+"\"><div class=sh><span class=step>Parte "+parte+" de "+partes+"</span><h2>"+esc(q.g)+"</h2>"+(q.opt?"<p class=oph>Opcional. Responda só o que quiser; o que ficar em branco a gente conversa numa ligação rápida.</p>":"")+"</div>";}
      var one=q.sub.length===1,tit=q.l||q.sub[0].l,req=q.sub.some(function(s){return s.req});
      h+="<div class=q data-n="+q.n+"><div class=qh><span class=qn>"+q.n+"</span><div class=qt>"+esc(tit)+(req?" <span class=req>*</span>":"")+"</div></div>";
      q.sub.forEach(function(s){
        h+="<div class=f>";
        if(!one)h+="<label class=fl>"+esc(s.l)+(s.req?" <span class=req>*</span>":"")+"</label>";
        if(s.hint)h+="<div class=hint>"+esc(s.hint)+"</div>";
        if(s.t==="text")h+="<input type=text data-k="+s.k+" placeholder=\""+esc(s.ph||"")+"\">";
        else if(s.t==="area")h+="<textarea rows=3 data-k="+s.k+" placeholder=\""+esc(s.ph||"")+"\"></textarea>";
        else h+="<div class=opts>"+s.opts.map(function(o){return "<label class=chip><input type="+(s.t==="multi"?"checkbox":"radio")+" name="+s.k+" value=\""+esc(o)+"\"><span>"+esc(o)+"</span></label>"}).join("")+"</div>";
        h+="</div>";});
      h+="</div>";});
    box.innerHTML=h+"</section>";
    function val(s){if(s.t==="text"||s.t==="area"){var el=box.querySelector("[data-k="+s.k+"]");return el?el.value.trim():""}return [].map.call(box.querySelectorAll("input[name="+s.k+"]:checked"),function(x){return x.value}).join(", ")}
    function setv(s,v){if(!v)return;if(s.t==="text"||s.t==="area"){var el=box.querySelector("[data-k="+s.k+"]");if(el)el.value=v;return}var vs=v.split(", ");[].forEach.call(box.querySelectorAll("input[name="+s.k+"]"),function(x){x.checked=vs.indexOf(x.value)>=0})}
    var reqs=subs.filter(function(s){return s.req});
    var ess=D.form.filter(function(q){return !q.opt});
    function respondida(q){var r=q.sub.filter(function(s){return s.req});return r.length?r.every(function(s){return val(s)}):q.sub.some(function(s){return val(s)})}
    function progresso(){var n=ess.filter(respondida).length,pronto=reqs.every(function(s){return val(s)});document.getElementById("bar").style.width=Math.round(100*n/ess.length)+"%";document.getElementById("pct").textContent=pronto?(n===ess.length?"Tudo pronto para enviar":"Pronto para enviar (as que faltam são opcionais)"):n+" de "+ess.length+" perguntas respondidas";}
    function salvar(){var o={};subs.forEach(function(s){o[s.k]=val(s)});try{localStorage.setItem(KEY,JSON.stringify(o))}catch(e){}progresso();}
    try{var r=JSON.parse(localStorage.getItem(KEY)||"{}");subs.forEach(function(s){setv(s,r[s.k])})}catch(e){}
    box.addEventListener("change",function(e){var t=e.target;if(t.type==="checkbox"){var s=subs.filter(function(x){return x.k===t.name})[0];var av=t.closest(".f").querySelector(".hint");if(s&&s.max&&box.querySelectorAll("input[name="+s.k+"]:checked").length>s.max){t.checked=false;if(av){av.textContent="Marque no máximo "+s.max+" opções.";av.classList.add("aviso")}}else if(av&&s&&s.hint){av.textContent=s.hint;av.classList.remove("aviso")}}salvar();});
    box.addEventListener("input",salvar);progresso();
    function texto(){var t=D.mark+"\n";subs.forEach(function(s){var v=val(s);if(v)t+="\n▸ "+s.l+"\n"+v+"\n"});return t}
    function ok(){var m=document.getElementById("msg");[].forEach.call(box.querySelectorAll(".q.falta"),function(x){x.classList.remove("falta")});
      var falta=D.form.filter(function(q){return q.sub.some(function(s){return s.req&&!val(s)})});
      if(falta.length){falta.forEach(function(q){box.querySelector(".q[data-n=\""+q.n+"\"]").classList.add("falta")});m.className="msg err";m.textContent="Faltam as perguntas "+falta.map(function(q){return q.n}).join(", ")+". Elas estão marcadas em vermelho.";box.querySelector(".q.falta").scrollIntoView({behavior:"smooth",block:"center"});return false}
      m.className="msg";m.textContent="";return true}
    document.getElementById("go").addEventListener("click",function(){if(!ok())return;var o=document.getElementById("out"),t=texto();o.style.display="block";document.getElementById("txt").value=t;
      document.getElementById("wa").href="https://wa.me/"+(D.wa||"")+"?text="+encodeURIComponent(t);
      if(D.mail)document.getElementById("em").href="mailto:"+D.mail+"?subject="+encodeURIComponent("📋 Briefing de conteúdo — "+nome())+"&body="+encodeURIComponent(t);
      o.scrollIntoView({behavior:"smooth"})});
    var nome=function(){return ((box.querySelector("[data-k=name]")||{}).value||"").trim()};
    if(!D.mail)document.getElementById("em").style.display="none";
    document.getElementById("cp").addEventListener("click",function(){var t=document.getElementById("txt"),m=document.getElementById("cpm");var done=function(){m.textContent="Copiado. Agora é só colar na conversa e enviar."};var manual=function(){t.focus();t.select();m.textContent="Texto selecionado: toque e segure para copiar."};try{navigator.clipboard.writeText(t.value).then(done,manual)}catch(e){manual()}});
  }
  function buildBriefingFormHtml(cfg){
    var para=cfg.cliente?String(cfg.cliente).trim():"",de=cfg.nome?String(cfg.nome):"",wa=String(cfg.whats||"").replace(/\D/g,"");if(wa&&wa.length<=11)wa="55"+wa;
    var mail=String(cfg.email||"").trim();
    var data=JSON.stringify({mark:BRIEF_MARK,wa:wa,mail:mail,cliente:para,form:BRIEF_FORM}).replace(/</g,"\\u003c");
    var css='*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;background:#f6f4ef;color:#23212b}'+
      'main{max-width:620px;margin:0 auto;padding:0 16px 56px}'+
      '.hero{background:#23212b;color:#fff;border-radius:0 0 22px 22px;padding:28px 22px 24px;margin:0 -16px 18px}.hero .de{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#f3c969}.hero h1{font-size:26px;line-height:1.2;margin:10px 0 8px;font-weight:700}.hero p{margin:0;color:#d9d6e3;font-size:15px}'+
      '.chips-info{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.chips-info span{background:rgba(255,255,255,.1);border-radius:20px;padding:4px 11px;font-size:13px}'+
      '.prog{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:#f6f4ef;padding:10px 0 8px}.track{height:6px;background:#e7e2d8;border-radius:6px;overflow:hidden}#bar{height:100%;width:0;background:#e0a72e;transition:width .3s}#pct{font-size:12.5px;color:#7a7585;margin-top:5px}'+
      '.sec{margin-top:18px}.sh{margin:8px 2px 10px}.step{font-size:12px;font-weight:600;color:#b07d12;letter-spacing:.04em}.sh h2{font-size:21px;margin:2px 0 0}.oph{margin:6px 0 0;font-size:14px;color:#6f6a7a}'+
      '.q{background:#fff;border:1px solid #ebe6dc;border-radius:16px;padding:16px 16px 14px;margin-bottom:12px;transition:border-color .2s}.q.falta{border-color:#d9534f;box-shadow:0 0 0 3px rgba(217,83,79,.12)}'+
      '.qh{display:flex;gap:10px;align-items:flex-start;margin-bottom:10px}.qn{flex:0 0 26px;height:26px;border-radius:50%;background:#23212b;color:#fff;font-size:13px;font-weight:700;display:grid;place-items:center;margin-top:1px}.qt{font-weight:650;font-size:16.5px;line-height:1.35}.req{color:#c9483f}'+
      '.f{margin-top:10px}.f:first-of-type{margin-top:0}.fl{display:block;font-size:14px;font-weight:600;color:#4a4655;margin-bottom:6px}.hint{font-size:12.5px;color:#8a8595;margin:-2px 0 6px}.hint.aviso{color:#c9483f;font-weight:600}'+
      'input[type=text],textarea{width:100%;border:1px solid #ddd7cb;border-radius:12px;padding:12px 13px;font:inherit;font-size:16px;background:#fcfbf8;color:inherit;resize:vertical}input[type=text]:focus,textarea:focus{outline:none;border-color:#e0a72e;box-shadow:0 0 0 3px rgba(224,167,46,.18);background:#fff}'+
      '.opts{display:flex;flex-wrap:wrap;gap:8px}.chip{position:relative;cursor:pointer}.chip input{position:absolute;opacity:0;pointer-events:none}.chip span{display:inline-block;border:1px solid #ddd7cb;border-radius:22px;padding:9px 15px;font-size:15px;background:#fcfbf8;transition:all .15s}.chip input:checked+span{background:#23212b;border-color:#23212b;color:#fff}.chip input:focus-visible+span{box-shadow:0 0 0 3px rgba(224,167,46,.35)}'+
      '.sec.opt .q{background:#fbf8f1;border-style:dashed}.sec.opt .qn{background:#b9b2a3}'+
      '.btn{display:block;width:100%;text-align:center;text-decoration:none;border:0;border-radius:14px;padding:15px 16px;font:inherit;font-weight:650;font-size:16px;cursor:pointer;margin-top:10px}.pri{background:#23212b;color:#fff}.wa{background:#25D366;color:#fff}.sec2{background:#ece7dd;color:#23212b}'+
      '.msg{font-size:14px;margin-top:10px;color:#6f6a7a}.msg.err{color:#c9483f;font-weight:600}#out{display:none;margin-top:22px}.done{background:#fff;border:1px solid #ebe6dc;border-radius:16px;padding:18px}.done h2{margin:0 0 4px;font-size:21px}.done p{margin:0 0 6px;color:#6f6a7a;font-size:15px}'+
      '#txt{width:100%;min-height:140px;margin-top:12px;font-size:13px}.rod{text-align:center;color:#9a95a3;font-size:12.5px;margin-top:26px}';
    var S='scr'+'ipt';
    return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Briefing de conteúdo'+(para?' · '+esc(para):'')+'</title><style>'+css+'</style></head><body><main>'+
      '<header class="hero">'+(de?'<div class="de">'+esc(de)+'</div>':'')+'<h1><span id="saud">'+(para?'Oi, '+esc(para)+'!':'Oi!')+'</span> Vamos montar o seu conteúdo?</h1>'+
      '<p>Com estas respostas eu monto a sua estratégia, a linha editorial e o calendário. Responda do seu jeito, sem medo de errar: nada aqui é definitivo e a gente ajusta junto depois.</p>'+
      '<div class="chips-info"><span>⏱ Uns 5 minutos</span><span>14 perguntas + 7 opcionais</span><span>Salva sozinho enquanto você preenche</span></div></header>'+
      '<div class="prog"><div class="track"><div id="bar"></div></div><div id="pct"></div></div>'+
      '<div id="form"></div><button class="btn pri" id="go">Concluir briefing</button><div class="msg" id="msg"></div>'+
      '<div id="out"><div class="done"><h2 id="obg">Obrigado'+(para?', '+esc(para):'')+'!</h2><p>Agora é só enviar as respostas'+(de?' para '+esc(de):'')+'.</p>'+
      '<a class="btn wa" id="wa" href="#" target="_blank" rel="noopener">Enviar pelo WhatsApp'+(de?' para '+esc(de.split(" ·")[0]):'')+'</a><a class="btn pri" id="em" href="#">Enviar por e-mail</a><button class="btn sec2" id="cp">Copiar respostas</button>'+
      '<div class="msg" id="cpm">Se o WhatsApp não abrir com o texto, toque em Copiar respostas e cole na conversa.</div><textarea id="txt" readonly></textarea></div></div>'+
      '<p class="rod">'+(de?esc(de)+' · ':'')+'Suas respostas ficam só neste aparelho até você enviar.</p>'+
      '</main><'+S+'>('+briefFormApp.toString()+')('+data+');</'+S+'></body></html>';
  }
  function parseBriefing(txt){
    txt=String(txt||"").replace(/\r/g,"");if(txt.indexOf("▸")<0)return null;
    var norm=function(s){return normalizeTextPanel(s).replace(/[^a-z0-9]+/g,"")},byLbl={};
    BRIEF_ANTIGO.forEach(function(a){byLbl[norm(a[1])]=a[0];});
    BRIEF_FORM.forEach(function(q){q.sub.forEach(function(s){byLbl[norm(s.l)]=s.k;});});
    var out={};txt.split(/\n?▸ ?/).slice(1).forEach(function(ch){var nl=ch.indexOf("\n");var lbl=(nl<0?ch:ch.slice(0,nl)).trim(),v=(nl<0?"":ch.slice(nl+1)).trim();
      var k=byLbl[norm(lbl)];if(k&&v)out[k]=v;});
    if(!out.name)return null;
    // Formulário curto → os mesmos campos que ficha, rotina e agentes já usam.
    if(out.atende)out.regiao=(out.atende==="Os dois"?"Presencial e online":out.atende)+(out.regiao?" · "+out.regiao:"");
    if(out.tom&&out.tom.split(", ").every(function(t){return BRIEF_TOM.indexOf(t)>=0}))out.tom=out.tom.toLowerCase();
    if(!out.publico&&(out.momento||out.idade||out.genero))out.publico=[out.momento,out.idade?"idade: "+out.idade:"",out.genero?"gênero: "+out.genero:""].filter(Boolean).join("; ");
    if(!out.objecoes&&(out.hesita||out.hesita_outro))out.objecoes=[out.hesita,out.hesita_outro].filter(Boolean).join(", ");
    var pq=[out.pergunta1,out.pergunta2,out.pergunta3].filter(Boolean);if(pq.length)out.perguntas=pq.join(" | ");
    if(out.tempo&&BRIEF_TEMPO[out.tempo])out.tempo=BRIEF_TEMPO[out.tempo];
    if(!out.funil&&out.objetivo)out.funil=BRIEF_OBJ_FUNIL[out.objetivo]||(out.objetivo.indexOf(", ")>0?"Equilíbrio entre os três":"");
    if(out.formacao)out.provas=[out.provas,out.formacao].filter(Boolean).join("; ");
    var extra=[out.aprovacao?"Aprovação: "+out.aprovacao:"",out.visual?"Identidade visual: "+out.visual:"",out.autoriz_imagem?"Autorização de imagem de clientes: "+out.autoriz_imagem:""].filter(Boolean).join("\n");
    if(extra)out.obs=[out.obs,extra].filter(Boolean).join("\n");
    return out;
  }
  function briefingNarrativa(b){
    var s=[];function add(k,frase){if(b[k])s.push(frase.replace("%",b[k].replace(/\n+/g,"; ").replace(/[.!;]+$/,"")));}
    add("oferta",b.atende?"O que fazemos e o que mais queremos vender: %.":"Vendemos %.");add("ticket","Nosso ticket médio / faixa de preço é %.");add("publico","Meu público são %.");add("dores","A maior dor deles é %.");
    add("desejos","Eles desejam %.");add("objecoes","Uma objeção comum é %.");add("diferencial","Nosso diferencial é %.");add("provas","Provas e experiência: %.");
    add("proposito","Nosso propósito é %.");add("identidade","Queremos ser percebidos como %.");
    add("tom","Falamos de forma %.");add("objetivo","Objetivos com o Instagram: %.");add("funil","Foco atual do conteúdo: %.");add("regiao","Atendemos em %.");add("restricoes","Não pode aparecer no conteúdo: %.");
    add("meta","A principal meta para os próximos 3 meses é %.");add("perguntas","Perguntas que os clientes mais fazem: %.");
    if(b.historia)s.push("História de um cliente"+(b.historia_uso==="Sim"?" (pode ser usada no conteúdo, sem o nome)":" (NÃO usar no conteúdo: só contexto)")+": "+b.historia.replace(/\n+/g,"; ")+".");
    add("processo","Como é o primeiro atendimento: %.");
    add("aparece","Sobre aparecer nos vídeos: %.");add("datas","Datas importantes: %.");add("obs","Observações: %.");
    return s.join("\n");
  }
  // Ficha, metas e rotina a partir de um briefing de formulário (sem mexer no
  // Content DNA). Usado ao importar e também quando o briefing é colado no DNA.
  function fichaDoBriefing(id,b){
    var rec=Object.assign({},DB_CLIENTS[id]);
    rec.niche=b.niche||rec.niche||"";
    var fic=Object.assign({},rec.ficha||{});["instagram","site","regiao","ticket","oferta","publico","tom","restricoes"].forEach(function(k){if(b[k])fic[k]=b[k];});
    rec.metas={objetivos:(b.objetivo||"").split(/,\s*(?=[A-ZÁÉÍÓÚ])/).filter(Boolean),meta:b.meta||"",proposito:b.proposito||"",identidade:b.identidade||""};
    var extra=[b.objetivo?"Objetivos: "+b.objetivo:"",b.datas?"Datas: "+b.datas:"",b.obs||"",b.responsavel?"Briefing preenchido por "+b.responsavel:""].filter(Boolean).join("\n");
    if(extra)fic.obs=(fic.obs?fic.obs+"\n":"")+extra;
    rec.ficha=fic;
    if(b.whats&&!(rec.admin&&rec.admin.whats))rec.admin=Object.assign({},rec.admin||{},{whats:b.whats});
    if(b.email&&!(rec.admin&&rec.admin.email))rec.admin=Object.assign({},rec.admin||{},{email:b.email});
    if(b.responsavel&&!(rec.admin&&rec.admin.contato))rec.admin=Object.assign({},rec.admin||{},{contato:b.responsavel.split(" ")[0]});
    var r=Object.assign({},rotinaOf(id));
    var ti=TEMPO_OPC.map(function(o){return o[1]}).indexOf(b.tempo);if(ti>=0){r.tempoGrav=TEMPO_OPC[ti][0];r.maxGrav=CAPACIDADE[r.tempoGrav].grav;}
    var fi=BRIEF_FREQ.indexOf(b.frequencia),n=fi>=0?[3,4,5,7][fi]:0;
    if(n){var map={"Dom":0,"Seg":1,"Ter":2,"Qua":3,"Qui":4,"Sex":5,"Sáb":6},esc2=(b.dias||"").split(/,\s*/).map(function(d){return map[d]}).filter(function(x){return x!=null});
      // Mais dias marcados que postagens: espalha pela semana (Seg–Sex, 3 → Seg, Qua, Sex).
      var dias=esc2.length>n?(n===1?[esc2[0]]:Array.apply(null,Array(n)).map(function(_,i){return esc2[Math.round(i*(esc2.length-1)/(n-1))]})):esc2.slice();DIAS_PADRAO[n].forEach(function(d){if(dias.length<n&&dias.indexOf(d)<0)dias.push(d);});r.diasPost=dias.sort();}
    var gi=DIAS_SEM_LONGO.indexOf(b.gravdia);if(gi>=0)r.gravDia=gi;
    if(b.funil){var fz=/\(topo\)/.test(b.funil)?"topo":/\(meio\)/.test(b.funil)?"meio":/\(fundo\)/.test(b.funil)?"fundo":"equilibrio";r.foco=fz;}
    rec.rotina=r;
    return rec;
  }
  async function importarBriefing(b,destino){
    var nome=b.name.trim(),alvo=destino&&DB_CLIENTS[destino]?destino:null,norm=function(x){return normalizeTextPanel(x).replace(/[^a-z0-9]+/g,"")};
    if(!alvo)Object.keys(DB_CLIENTS).forEach(function(id){if(norm(DB_CLIENTS[id].name||"")===norm(nome))alvo=id;});
    if(alvo&&!destino&&!confirm("Já existe um cliente chamado \""+nome+"\". Atualizar a ficha dele com este briefing?"))alvo=null;
    var id=alvo||await createClient(nome,b.niche||"");
    var rec=fichaDoBriefing(id,b),fi=BRIEF_FREQ.indexOf(b.frequencia),n=fi>=0?[3,4,5,7][fi]:0;
    var narr=briefingNarrativa(b);rec.briefing=(rec.briefing?rec.briefing+"\n\n":"")+narr;
    await saveClientRecord(id,rec);
    var cli=byId(id);if(cli){cli.niche=rec.niche;cli.full=rec.name+(rec.niche?" — "+rec.niche:"");refreshClientOptions();}
    var refs=[];function addRefs(txt,tipo){String(txt||"").split(/\n|;|,(?=\s*@)/).map(function(x){return x.trim()}).filter(Boolean).forEach(function(l){var m=l.match(/^(@?[\w.]+)\s*[-—–:]?\s*(.*)$/);refs.push({nome:m?m[1]:l.slice(0,40),tipo:tipo,descricao:m?m[2]:l});});}
    addRefs(b.referencias,"Referência de estilo");addRefs(b.concorrentes,"Concorrente direto");
    if(refs.length)await dbDoc("cos_refs/"+id).set({items:refs.slice(0,5)});
    var dnaDoc=await dbDoc("cos_dna/"+id).get(),atuais=dnaDoc.exists?((dnaDoc.data()||{}).entries||[]):[];
    var novas=irisToDnaEntries(irisExtract(narr,"Briefing do cliente (formulário) — "+new Date().toLocaleDateString("pt-BR")));
    await dbDoc("cos_dna/"+id).set({entries:atuais.concat(novas)});
    delete DB_STATE_CACHE[id];
    return {id:id,atualizado:!!alvo,sugestoes:novas.length,refs:Math.min(5,refs.length),freq:n,tempo:b.tempo||""};
  }
  // ---------- Caixa de entrada de briefings: lê do Gmail do estrategista (conector) → cria o cliente → monta tudo ----------
  var INBOX_Q='subject:"Briefing de conteúdo" newer_than:180d';
  async function gmail(tool,input){
    var mcp=null;try{mcp=window.claude&&claude.use?await claude.use("mcp"):null;}catch(e){}
    if(!mcp)throw {code:"no_mcp"};
    var r=await mcp.callTool("Gmail",tool,input,{cache:false});return r&&r.payload!=null?r.payload:r;
  }
  function gmailErr(e){var c=e&&e.code;
    if(c==="no_mcp"||c==="not_granted"||c==="capability_disabled"||c==="capability_removed")return "A caixa de entrada só funciona no painel aberto pelo link, no claude.ai.";
    if(c==="needs_reauth")return "Reconecte o Gmail em claude.ai → Configurações → Conectores e tente de novo.";
    if(c==="server_not_connected"||c==="server_not_found")return "Adicione o conector Gmail em claude.ai → Configurações → Conectores.";
    if(c==="selection_required")return "Você tem mais de um Gmail conectado — escolha qual usar no aviso do Claude.";
    if(c==="not_in_manifest")return "O painel não tem permissão para ler o Gmail. Recarregue a página e permita quando o Claude perguntar.";
    if(c==="blocked_by_policy"||c==="approval_required")return "A política da sua conta bloqueou a leitura do Gmail.";
    if(c==="server_unavailable"||c==="rate_limited")return "O Gmail não respondeu agora — tente de novo em instantes.";
    return "Não consegui ler o Gmail agora"+(c?" ("+c+")":"")+" — tente de novo.";}
  function msgsOf(t){return (t&&(t.messages||t.message))||[];}
  function corpoOf(m){var c=m.plaintextBody||m.plaintext_body||m.plainTextBody||m.textBody||m.body;if(c)return String(c);
    for(var k in m){if(typeof m[k]==="string"&&m[k].indexOf("▸")>=0)return m[k];}return String(m.snippet||"");}
  async function inboxStatus(){var st={};try{var sn=await CAP.db.collection("cos_inbox").get();sn.docs.forEach(function(d){var v=d.data();if(v)st[d.id]=v;});}catch(e){}return st;}
  // ---- Retornos de pauta (aprovação / ajuste) vindos do arquivo do cliente → aplicados no painel ----
  var RET_Q='subject:"Retorno de pauta" newer_than:120d';
  function parseRetornos(txt){var out=[],re=/ref:\s*CAL\|([^|\s]+)\|([^|\s]+)\|(aprovado|ajuste)/g,m,ini=0;txt=String(txt||"").replace(/\r/g,"");
    while((m=re.exec(txt))){var bloco=txt.slice(ini,m.index),linhas=bloco.split("\n").map(function(l){return l.trim()}).filter(Boolean);
      var i0=-1;for(var k=linhas.length-1;k>=0;k--){if(/^(✅|✏️)/.test(linhas[k])){i0=k;break;}}
      var nota=m[3]==="ajuste"&&i0>=0?linhas.slice(i0+1).join("\n").trim():"";
      out.push({cid:m[1],iid:m[2],status:m[3],note:nota});ini=re.lastIndex;}
    return out;}
  async function aplicarRetornos(lista,quando){var ok=0,res={aprovado:0,ajuste:0};
    for(var i=0;i<lista.length;i++){var r=lista[i];if(!DB_CLIENTS[r.cid])continue;
      try{var ref=dbItemsCol("cos_calendar",r.cid).doc(r.iid),d=await ref.get();if(!d.exists)continue;
        var patch={clientStatus:r.status,clientAt:quando||new Date().toISOString()};if(r.status==="ajuste")patch.clientNote=r.note||"(sem detalhes)";
        await ref.update(patch);ok++;res[r.status]++;
        var cache=DB_STATE_CACHE[r.cid];if(cache&&cache.calendar){(cache.calendar.items||[]).forEach(function(it){if(it.id===r.iid)Object.assign(it,patch);});}
      }catch(e){}}
    return {total:ok,aprovado:res.aprovado,ajuste:res.ajuste};}
  async function sincronizarRetornosGmail(){
    var res=await gmail("search_threads",{query:RET_Q,pageSize:25,view:"THREAD_VIEW_METADATA_ONLY"}),th=(res&&res.threads)||[],st=await inboxStatus(),soma={total:0,aprovado:0,ajuste:0};
    for(var i=0;i<th.length;i++){
      var t=await gmail("get_thread",{threadId:th[i].id,messageFormat:"PLAIN_TEXT"}),ms=msgsOf(t).slice().sort(function(a,b){return String(a.date||"")<String(b.date||"")?-1:1});
      for(var j=0;j<ms.length;j++){var m=ms[j],chave="msg_"+(m.id||(th[i].id+"_"+j));if(st[chave])continue;
        var r=await aplicarRetornos(parseRetornos(corpoOf(m)),m.date?new Date(m.date).toISOString():null);
        soma.total+=r.total;soma.aprovado+=r.aprovado;soma.ajuste+=r.ajuste;
        await CAP.db.doc("cos_inbox/"+chave).set({status:"aplicado",tipo:"retorno",n:r.total,at:new Date().toISOString()});}
    }
    return soma;}
  async function renderInbox(){
    var box=I("#inboxList");if(!box)return;setBusy(box,"Procurando briefings e retornos de pauta no Gmail…");
    var retHtml="";
    try{var sr=await sincronizarRetornosGmail();retHtml='<div style="font-size:12.5px;margin-bottom:10px;padding:8px 10px;border-radius:9px;background:var(--surface-2)">📌 Retornos de pauta: '+(sr.total?'<b>'+sr.total+' novo(s) aplicado(s)</b> — ✓ '+sr.aprovado+' aprovação(ões), ✏️ '+sr.ajuste+' ajuste(s). Veja em Calendário ou Clientes ativos.':'nenhum novo.')+'</div>';}
    catch(e){retHtml='<div style="font-size:12px;color:var(--warn);margin-bottom:8px">Retornos de pauta: '+esc(gmailErr(e))+'</div>';}
    try{
      var res=await gmail("search_threads",{query:INBOX_Q,pageSize:25,view:"THREAD_VIEW_MINIMAL"});
      var th=(res&&res.threads)||[],st=await inboxStatus();clearBusy(box);
      if(!th.length){box.innerHTML=retHtml+'<div style="font-size:12.5px;color:var(--muted)">Nenhum briefing recebido ainda. Quando o cliente tocar em <b>Enviar por e-mail</b> no formulário, ele aparece aqui.</div>';return;}
      box.innerHTML=retHtml+th.map(function(t){var m=msgsOf(t)[0]||{},sub=String(m.subject||"Briefing").replace(/^.*Briefing de conteúdo\s*[—-]?\s*/i,"")||"(sem nome)",s0=st[t.id],dt=m.date?new Date(m.date).toLocaleDateString("pt-BR"):"";
        return '<div class="ag-row" style="cursor:default;align-items:center"><div style="flex:1;min-width:0"><b>'+esc(sub)+'</b><div class="ag-sub">'+esc(m.sender||"")+(dt?' · '+esc(dt):'')+'</div></div>'+
          (s0&&s0.status==="importado"?'<span class="badge act">✓ importado</span>'+(s0.clientId&&DB_CLIENTS[s0.clientId]?'<button class="btn" data-inbox-open="'+esc(s0.clientId)+'">Abrir</button>':''):
           s0&&s0.status==="ignorado"?'<span class="badge">ignorado</span><button class="btn ghost" data-inbox-go="'+esc(t.id)+'">Importar mesmo assim</button>':
           '<button class="btn pri genbtn" data-inbox-go="'+esc(t.id)+'">✦ Criar cliente e montar tudo</button><button class="btn ghost" data-inbox-skip="'+esc(t.id)+'">Ignorar</button>')+'</div>';}).join('');
      Array.prototype.forEach.call(box.querySelectorAll('[data-inbox-go]'),function(b){b.addEventListener('click',function(){importarDoGmail(b.getAttribute('data-inbox-go'),b);})});
      Array.prototype.forEach.call(box.querySelectorAll('[data-inbox-skip]'),function(b){b.addEventListener('click',function(){CAP.db.doc("cos_inbox/"+b.getAttribute('data-inbox-skip')).set({status:"ignorado",at:new Date().toISOString()}).then(renderInbox);})});
      Array.prototype.forEach.call(box.querySelectorAll('[data-inbox-open]'),function(b){b.addEventListener('click',function(){setClient(b.getAttribute('data-inbox-open'));go("calendar");})});
    }catch(e){clearBusy(box);box.innerHTML='<div style="font-size:12.5px;color:var(--warn)">'+esc(gmailErr(e))+'</div>';}
  }
  async function importarDoGmail(threadId,btn){
    if(btn)btn.disabled=true;var msg=I("#inboxMsg");setBusy(msg,"Lendo o briefing…");
    try{
      var t=await gmail("get_thread",{threadId:threadId,messageFormat:"PLAIN_TEXT"}),parsed=null;
      msgsOf(t).forEach(function(m){if(!parsed)parsed=parseBriefing(corpoOf(m));});
      if(!parsed){clearBusy(msg);msg.textContent="Esse e-mail não tem as respostas completas do formulário — peça ao cliente para reenviar (ou use Copiar respostas).";msg.style.color="var(--warn)";if(btn)btn.disabled=false;return;}
      var dias=+((I("#inboxDias")||{}).value||30);
      var r=await importarBriefing(parsed);
      await CAP.db.doc("cos_inbox/"+threadId).set({status:"importado",clientId:r.id,at:new Date().toISOString()});
      clearBusy(msg);msg.textContent="";
      montarTudo(r.id,dias);
    }catch(e){clearBusy(msg);msg.textContent=e&&e.code?gmailErr(e):"Não consegui importar agora — tente de novo.";msg.style.color="var(--warn)";if(btn)btn.disabled=false;}
  }
  function briefToolsHtml(){
    if(state.clientView)return '';
    return '<div class="card pad" style="margin-bottom:16px"><div class="bt" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--faint);margin-bottom:8px">Briefing do cliente por formulário</div>'+
      '<div style="font-size:12.5px;color:var(--muted);margin-bottom:12px">1) Baixe o formulário e envie ao cliente (WhatsApp/e-mail) · 2) ele preenche no celular e toca em <b>Enviar pelo WhatsApp</b> · 3) você cola a mensagem em <b>Importar briefing</b> — o cliente é criado com ficha, frequência, tempo de gravação e o Content DNA sugerido pela Íris.</div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" id="bfForm">📨 Formulário de briefing para enviar</button><button class="btn" id="bfImport">📥 Importar briefing (colar)</button></div></div>'+
      '<div class="card pad" style="margin-bottom:16px"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px"><div class="bt" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--faint)">📬 Caixa de entrada de briefings (Gmail)</div>'+
      '<span style="margin-left:auto;font-size:12px;color:var(--muted)">Calendário de</span><select id="inboxDias" style="font:inherit;font-size:12px;border:1px solid var(--line);border-radius:8px;padding:4px 6px;background:var(--surface)">'+[30,45,60,90].map(function(d){return '<option value="'+d+'">'+d+' dias</option>'}).join('')+'</select><button class="btn" id="inboxRefresh">↻ Verificar briefings e retornos</button></div>'+
      '<div id="inboxList" style="font-size:12.5px;color:var(--muted)">Clique em <b>Verificar novos briefings</b> — o painel procura no seu Gmail os briefings enviados pelo formulário e as aprovações/ajustes que os clientes mandam pelo calendário. Na primeira vez o Claude pede permissão para o painel ler o Gmail.</div><div id="inboxMsg" style="font-size:12px;margin-top:8px"></div></div>';
  }
  var MSG_PADRAO="Oi, [nome]! Tudo bem? Preparei um briefing rápido (uns 5 minutos) para montar a sua estratégia e o seu calendário de conteúdo. Abra o arquivo, responda do seu jeito e, no final, toque em \"Enviar por e-mail\". Quanto mais detalhes você colocar, mais personalizadas ficam a sua estratégia e as ideias de conteúdo. Qualquer dúvida, me chama!";
  function msgConvite(tpl,nome){var t=String(tpl||MSG_PADRAO);return nome?t.replace(/\[nome\]/gi,nome):t.replace(/,\s*\[nome\]/gi,"").replace(/\s*\[nome\]/gi,"");}
  // Formulário online (página publicada no claude.ai, liberada em Compartilhar → qualquer pessoa com o link).
  // Serve para todos os clientes: o nome vai no fim do link (…#carol-pedrosa). Abre em iPhone e Android.
  var BRIEF_LINK_PADRAO="https://claude.ai/artifact/KmFCqKBT9Yk9YyGwQ6vdVT";
  var MSG_LINK_PADRAO="Oi, [nome]! Tudo bem? Preparei um briefing rápido (uns 5 minutos) para montar a sua estratégia e o seu calendário de conteúdo. É só abrir o link, responder do seu jeito e, no final, tocar em \"Enviar pelo WhatsApp\":\n\n[link]\n\nQualquer dúvida, me chama!";
  function linkBriefing(base,cli){base=String(base||BRIEF_LINK_PADRAO).trim().replace(/#.*$/,"");return cli?base+"#"+slugify(cli):base;}
  function copiarParaCliente(t,m,aviso){
    function ok(){if(m){m.textContent=aviso;m.style.color="var(--good)";}}
    function velho(){var ta=document.createElement("textarea");ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand("copy")}catch(e){}document.body.removeChild(ta);ok();}
    try{navigator.clipboard.writeText(t).then(ok,velho)}catch(e){velho()}
  }
  function openBriefFormModal(nomePre){
    var c=formCfg();
    I("#overlay").innerHTML='<div class="scrim" id="scrim"></div><aside class="drawer" role="dialog" style="width:min(480px,100%)"><div class="dh"><div class="d-title">Formulário de briefing</div><button class="icon-btn" id="dclose">✕</button></div><div class="db">'+
      '<div class="block"><div class="fld"><label for="bfCliente">Nome do cliente (aparece no formulário e na mensagem)</label><input id="bfCliente" placeholder="Ex.: Carol Pedrosa"></div></div>'+
      '<div class="block"><div class="bt">🔗 Link · recomendado</div><div style="font-size:12.5px;color:var(--muted);margin-bottom:10px">Abre em qualquer celular, iPhone ou Android, direto no navegador. O cliente responde e as respostas chegam no seu WhatsApp, prontas para importar.</div>'+
      '<div class="fld"><label>Link deste cliente</label><div class="copybox" id="bfLinkPrev" style="word-break:break-all"></div></div>'+
      '<div class="fld"><label for="bfTplLink">Mensagem para enviar ([nome] e [link] são trocados sozinhos)</label><textarea class="ta" id="bfTplLink" style="min-height:130px">'+esc(c.msgLink||MSG_LINK_PADRAO)+'</textarea></div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn pri genbtn" id="bfCopyLinkMsg">📋 Copiar mensagem com link</button><button class="btn" id="bfCopyLink">🔗 Copiar só o link</button><button class="btn ghost" id="bfResetLink">Texto padrão</button></div><div id="bfLinkMsg" style="font-size:12px;color:var(--muted);margin-top:8px"></div>'+
      '<details style="margin-top:12px;font-size:12px;color:var(--muted)"><summary style="cursor:pointer">Endereço do formulário online</summary><div class="fld" style="margin-top:8px"><input id="bfBase" value="'+esc(c.base||BRIEF_LINK_PADRAO)+'"><div style="margin-top:6px">Na primeira vez, abra esse endereço e libere em <b>Compartilhar → Qualquer pessoa com o link</b>. Depois vale para todos os clientes.</div></div></details></div>'+
      '<div class="block"><div class="bt">⬇ Arquivo · alternativa</div><div style="font-size:12.5px;color:var(--muted);margin-bottom:10px">Um arquivo que o cliente abre no celular. Funciona bem no Android; no iPhone o WhatsApp costuma só mostrar uma prévia, por isso prefira o link.</div>'+
      '<div class="fld"><label for="bfNome">Seu nome ou agência (aparece no arquivo)</label><input id="bfNome" value="'+esc(c.nome||"")+'" placeholder="Ex.: Tarik · Estratégia de conteúdo"></div>'+
      '<div class="fld"><label for="bfWhats">Seu WhatsApp com DDD (para receber as respostas)</label><input id="bfWhats" value="'+esc(c.whats||"")+'" placeholder="Ex.: 21 99999-9999"></div>'+
      '<div class="fld"><label for="bfEmail">Seu e-mail (Gmail conectado: os briefings chegam na Caixa de entrada do painel)</label><input id="bfEmail" value="'+esc(c.email||"")+'" placeholder="seuemail@gmail.com"></div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn" id="bfBaixar">⬇ Baixar arquivo</button><button class="btn ghost" id="bfCopyMsg">📋 Copiar mensagem do arquivo</button></div><div id="bfMsg" style="font-size:12px;color:var(--muted);margin-top:8px"></div></div>'+
      '</div></aside>';
    I("#scrim").addEventListener('click',closeDrawer);I("#dclose").addEventListener('click',closeDrawer);document.addEventListener('keydown',escClose);
    if(typeof nomePre==="string"&&nomePre)I("#bfCliente").value=nomePre;
    function cli(){return I("#bfCliente").value.trim();}
    function lerCfg(){var cfg={nome:I("#bfNome").value.trim(),whats:I("#bfWhats").value.trim(),email:I("#bfEmail").value.trim(),msg:c.msg||MSG_PADRAO,msgLink:I("#bfTplLink").value,base:I("#bfBase").value.trim()||BRIEF_LINK_PADRAO};saveFormCfg(cfg);return cfg;}
    function link(){return linkBriefing(I("#bfBase").value,cli());}
    function prev(){I("#bfLinkPrev").textContent=link();}
    prev();["#bfCliente","#bfBase"].forEach(function(s){I(s).addEventListener('input',prev)});
    I("#bfResetLink").addEventListener('click',function(){I("#bfTplLink").value=MSG_LINK_PADRAO;lerCfg();});
    I("#bfCopyLink").addEventListener('click',function(){lerCfg();copiarParaCliente(link(),I("#bfLinkMsg"),"✓ Link copiado. Cole na conversa do cliente.");});
    I("#bfCopyLinkMsg").addEventListener('click',function(){lerCfg();copiarParaCliente(msgConvite(I("#bfTplLink").value,cli()).replace(/\[link\]/gi,link()),I("#bfLinkMsg"),"✓ Mensagem com link copiada. Cole no WhatsApp do cliente.");});
    I("#bfCopyMsg").addEventListener('click',function(){lerCfg();copiarParaCliente(msgConvite(c.msg||MSG_PADRAO,cli()),I("#bfMsg"),"✓ Mensagem copiada. Cole no WhatsApp junto com o arquivo.");});
    I("#bfBaixar").addEventListener('click',function(){var cfg=Object.assign({},lerCfg(),{cliente:cli()});
      downloadText("briefing-de-conteudo"+(cfg.cliente?"-"+slugify(cfg.cliente):"")+".html",buildBriefingFormHtml(cfg),"text/html",function(ok){var m=I("#bfMsg");if(m){m.textContent=ok?"✓ Baixado. Envie ao cliente.":"Não consegui baixar agora";m.style.color=ok?"var(--good)":"var(--warn)";}});});
  }
  // ---------- Montar tudo automaticamente: DNA (Íris) → Estratégia → Linha Editorial → Ideias → Calendário ----------
  var AUTO_STEPS=[["dna","Content DNA (Íris lê o briefing)"],["strategy","Estratégia (Átlas)"],["editorial","Linha Editorial (Bússola)"],["ideas","Ideias (Musa)"],["calendar","Calendário editorial (Cronos)"]];
  function autoFeito(k,g){g=g||{};return k==="dna"?(g.dna||[]).length>=5:k==="strategy"?!!g.strategy:k==="editorial"?(g.editorial||[]).length>0:k==="ideas"?(g.ideas||[]).length>0:((g.calendar&&g.calendar.items)||[]).length>0;}
  function autoModalHtml(done,atual,erro,days){
    return '<div class="scrim" id="scrim"></div><aside class="drawer" role="dialog" style="width:min(480px,100%)"><div class="dh"><div class="d-title">Montando tudo — '+esc(clientName(state.client))+'</div><button class="icon-btn" id="dclose">✕</button></div><div class="db"><div class="block">'+
      '<div style="font-size:12.5px;color:var(--muted);margin-bottom:12px">Cada agente usa o resultado do anterior. Leva alguns minutos — pode deixar esta janela aberta. Calendário de <b>'+days+' dias</b>, na frequência e com o limite de gravações da rotina do cliente.</div>'+
      AUTO_STEPS.map(function(st){var ok=done.indexOf(st[0])>=0,cur=atual===st[0];return '<div class="stepi'+(ok?' ok':'')+'" style="cursor:default"><span class="dot">'+(ok?'✓':cur&&!erro?'<span class="spinner" style="margin:0;width:11px;height:11px"></span>':'')+'</span>'+esc(st[1])+(cur&&erro?' <span style="color:var(--warn)">— '+esc(erro)+'</span>':'')+'</div>'}).join('')+
      (erro?'<div style="margin-top:14px"><button class="btn pri" id="autoRetry">Continuar de onde parou</button></div>':'')+
      (done.length===AUTO_STEPS.length?'<div style="margin-top:14px;font-size:13px">✓ Pronto! Revise o <b>Content DNA</b> (as sugestões ficam pendentes para você aprovar) e confira a <b>Linha Editorial</b> e o <b>Calendário</b>.</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn pri" id="autoGoCal">Ver o calendário</button><button class="btn" id="autoGoEd">Ver a linha editorial</button></div>':'')+
      '</div></div></aside>';
  }
  async function montarTudo(id,days){
    if(!CAP.sample){noAi();return;}
    if(state.client!==id)setClient(id);
    state.autoRunning=id;
    try{GENERATED=await loadDbClientState(id);}catch(e){state.autoRunning=null;throw e;}
    var done=[],atual="",erro="",lastErr=null;
    function draw(){if(state.client!==id)return;I("#overlay").innerHTML=autoModalHtml(done,atual,erro,days);I("#scrim").addEventListener('click',closeDrawer);I("#dclose").addEventListener('click',closeDrawer);
      var r=I("#autoRetry");if(r){r.addEventListener('click',function(){montarTudo(id,days)});cooldownBtn(r,lastErr,60);}
      var gc=I("#autoGoCal");if(gc)gc.addEventListener('click',function(){closeDrawer();go("calendar")});var ge=I("#autoGoEd");if(ge)ge.addEventListener('click',function(){closeDrawer();go("editorial")});}
    AUTO_STEPS.forEach(function(st){if(autoFeito(st[0],GENERATED))done.push(st[0]);});
    for(var i=0;i<AUTO_STEPS.length;i++){var k=AUTO_STEPS[i][0];if(done.indexOf(k)>=0)continue;
      if(state.client!==id){state.autoRunning=null;return;}
      atual=k;erro="";draw();
      try{
        if(k==="dna"){var rec=DB_CLIENTS[id]||{},brief=[rec.briefing||"",fichaCompact()].filter(Boolean).join("\n");
          var out=await CAP.sample.json(buildIrisPrompt(byId(id).name,brief),{modelTier:"default",cache:false});
          var entries=(GENERATED.dna||[]).slice();((out&&out.suggestions)||[]).forEach(function(x){if(!x||!x.field||!x.value)return;entries.push({section:x.section||"business",field:String(x.field),value:String(x.value),state:x.state||"HYPOTHESIS",status:"pending",src:"Briefing do cliente — Íris"});});
          await saveDna(id,entries);if(!entries.length)throw new Error("sem dados");}
        else if(k==="strategy"){await runGerarEstrategia();if(!GENERATED.strategy)throw new Error("falhou");}
        else if(k==="editorial"){await runGerarEditorial();if(!(GENERATED.editorial||[]).length)throw new Error("falhou");}
        else if(k==="ideas"){await gerarIdeiasCore(id,false,15);if(!(GENERATED.ideas||[]).length)throw new Error("falhou");}
        else{state.period=days;await runGerarPlanejamento(days);if(!((GENERATED.calendar&&GENERATED.calendar.items)||[]).length)throw new Error("falhou");}
        done.push(k);
      }catch(e){erro=e&&e.code?sampleErrCopy(e):"não deu certo agora — tente de novo";lastErr=e;state.autoRunning=null;draw();return;}
    }
    try{if(!(vitrineOf(id).mensagem)&&DB_CLIENTS[id]){var mv=await gerarMensagemVitrine();await saveClientRecord(id,Object.assign({},DB_CLIENTS[id],{vitrine:Object.assign({},vitrineOf(id),{mensagem:mv})}));}}catch(e){}
    state.autoRunning=null;atual="";draw();renderKpis();
  }
  function openBriefImportModal(destino){destino=typeof destino==="string"?destino:null;
    I("#overlay").innerHTML='<div class="scrim" id="scrim"></div><aside class="drawer" role="dialog" style="width:min(560px,100%)"><div class="dh"><div class="d-title">Importar briefing recebido</div><button class="icon-btn" id="dclose">✕</button></div><div class="db"><div class="block">'+
      '<div style="font-size:12.5px;color:var(--muted);margin-bottom:10px">Cole aqui a mensagem que o cliente enviou: o <b>briefing</b> (começa com “'+esc(BRIEF_MARK)+'”) ou um <b>retorno de pauta</b> (aprovação/ajuste vindo do calendário).</div>'+
      '<textarea class="ta" id="bfTxt" style="min-height:220px" placeholder="'+esc(BRIEF_MARK)+'&#10;&#10;▸ Nome da empresa ou marca&#10;…"></textarea>'+
      '<div id="bfPrev" style="font-size:12.5px;color:var(--muted);margin:10px 0"></div>'+
      '<button class="btn pri genbtn" id="bfGo" disabled>Criar cliente com este briefing</button><span id="bfIMsg" style="margin-left:10px;font-size:12px;color:var(--muted)"></span></div></div></aside>';
    I("#scrim").addEventListener('click',closeDrawer);I("#dclose").addEventListener('click',closeDrawer);document.addEventListener('keydown',escClose);
    var parsed=null;
    var rets=[];
    I("#bfTxt").addEventListener('input',function(){parsed=parseBriefing(this.value);var p=I("#bfPrev");rets=parsed?[]:parseRetornos(this.value);
      if(rets.length){p.innerHTML='✓ <b>'+rets.length+' retorno(s) de pauta</b> do cliente (aprovação/ajuste).';I("#bfGo").disabled=false;I("#bfGo").textContent="Aplicar retornos no calendário";return;}
      I("#bfGo").textContent="Criar cliente com este briefing";
      if(!parsed){p.innerHTML=this.value.trim()?'<span style="color:var(--warn)">Não reconheci o briefing — cole a mensagem inteira, do jeito que chegou.</span>':'';I("#bfGo").disabled=true;return;}
      var n=Object.keys(parsed).length;p.innerHTML='✓ <b>'+esc(parsed.name)+'</b>'+(parsed.niche?' — '+esc(parsed.niche):'')+' · '+n+' respostas'+(parsed.frequencia?' · '+esc(parsed.frequencia):'')+(parsed.tempo?' · gravação: '+esc(parsed.tempo):'');I("#bfGo").disabled=false;});
    I("#bfGo").addEventListener('click',async function(){
      if(!parsed&&rets.length){var rr=await aplicarRetornos(rets);closeDrawer();toast(rr.total?"✓ "+rr.total+" retorno(s) aplicados: "+rr.aprovado+" aprovação(ões), "+rr.ajuste+" ajuste(s).":"Não encontrei essas pautas no painel.");renderView(state.view);return;}
      if(!parsed)return;if(!CAP.db){noAi();return;}
      I("#bfGo").disabled=true;setBusy(I("#bfIMsg"),"Importando…");
      try{var r=await importarBriefing(parsed,destino);setClient(r.id);if(!destino)go("dna");
        I("#overlay").innerHTML='<div class="scrim" id="scrim"></div><aside class="drawer" role="dialog" style="width:min(480px,100%)"><div class="dh"><div class="d-title">'+(r.atualizado?'Cliente atualizado':'Cliente criado')+' ✓</div><button class="icon-btn" id="dclose">✕</button></div><div class="db"><div class="block">'+
          '<div style="font-size:13px;margin-bottom:12px"><b>'+esc(parsed.name)+'</b> — ficha preenchida, '+r.sugestoes+' sugestões no Content DNA'+(r.refs?', '+r.refs+' referência(s)':'')+(r.freq?', <b>'+r.freq+' conteúdos/semana</b>':'')+(r.tempo?', gravação: <b>'+esc(r.tempo)+'</b>':'')+'.</div>'+
          '<div style="font-size:12.5px;color:var(--muted);margin-bottom:12px">Quer que o painel monte o resto agora? A Íris lê o briefing, e os agentes geram Estratégia → Linha Editorial → Ideias → Calendário, na frequência que o cliente pediu.</div>'+
          '<div class="plrow"><span class="pllbl">Calendário de</span>'+[30,45,60,90].map(function(d){return '<button class="preset autoDays" data-days="'+d+'" style="'+(d===30?'background:var(--brand-weak);color:var(--brand-ink);border-color:transparent':'')+'">'+d+' dias</button>'}).join('')+'</div>'+
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn pri genbtn" id="autoGo">✦ Montar tudo automaticamente</button><button class="btn" id="autoNo">Agora não — vou revisar antes</button></div></div></div></aside>';
        var dias=30;I("#scrim").addEventListener('click',closeDrawer);I("#dclose").addEventListener('click',closeDrawer);I("#autoNo").addEventListener('click',closeDrawer);
        Array.prototype.forEach.call(document.querySelectorAll('.autoDays'),function(b){b.addEventListener('click',function(){dias=+b.getAttribute('data-days');Array.prototype.forEach.call(document.querySelectorAll('.autoDays'),function(x){x.style.cssText=x===b?'background:var(--brand-weak);color:var(--brand-ink);border-color:transparent':''});})});
        I("#autoGo").addEventListener('click',function(){montarTudo(r.id,dias);});}
      catch(e){I("#bfIMsg").textContent="Não consegui importar — tente de novo.";I("#bfIMsg").style.color="var(--warn)";I("#bfGo").disabled=false;}});
  }
