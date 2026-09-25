  // ===================================================================
  // IA AO VIVO (sample) + PERSISTÊNCIA (db) — clientes reais criados no
  // painel. Só funciona quando este painel é aberto pelo LINK PUBLICADO no
  // claude.ai: window.claude só existe ali (a cópia offline/painel.html
  // não tem window.claude — os botões "Gerar" ficam ocultos com um aviso).
  // ===================================================================
  var CAP={sample:null,db:null,ready:false};
  var DB_CLIENTS={}; // clientId -> {id,name,niche,createdAt}
  var DB_STATE_CACHE={}; // clientId -> estado montado (cache em memória)
  // Bibliotecas (gatilhos, elementos, formatos) embutidas por `npm run panel:sync` a partir do código.
  var LIB={gatilhos:NICHE_FORMATS.gatilhos||[],elementos:NICHE_FORMATS.elementos||[],formatos:NICHE_FORMATS.formatos||[]};
  function isDbClient(id){return !!DB_CLIENTS[id];}
  function aiAvailable(){return !!(CAP.sample&&CAP.db);}
  function dbDoc(path){return CAP.db.doc(path);}
  function dbItemsCol(root,id){return dbDoc(root+"/"+id).collection("items");}
  // ---- Armazenamento local (fallback) — quando o painel é aberto como arquivo
  // (sem window.claude), os clientes e tudo que você preenche ficam gravados
  // NESTE navegador, com a mesma API do db publicado. A IA ao vivo continua
  // exclusiva do link do claude.ai. ----
  function localDb(){
    var KEY="cos-db-v1";
    function load(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")||{}}catch(e){return {}}}
    function save(s){localStorage.setItem(KEY,JSON.stringify(s));}
    function snap(path,s){return {id:path.split('/').pop(),exists:Object.prototype.hasOwnProperty.call(s,path),data:function(){return s[path]}};}
    function doc(path){return {id:path.split('/').pop(),
      get:async function(){return snap(path,load())},
      set:async function(v){var s=load();s[path]=JSON.parse(JSON.stringify(v));save(s);},
      update:async function(v){var s=load();s[path]=Object.assign({},s[path]||{},JSON.parse(JSON.stringify(v)));save(s);},
      delete:async function(){var s=load();delete s[path];save(s);},
      collection:function(n){return col(path+"/"+n)}};}
    function col(prefix){var depth=prefix.split('/').length+1;return {doc:function(id){return doc(prefix+"/"+id)},
      get:async function(){var s=load();return {docs:Object.keys(s).filter(function(k){return k.indexOf(prefix+"/")===0&&k.split('/').length===depth}).map(function(k){return snap(k,s)})}}};}
    return {doc:doc,collection:col};
  }
  function toast(text){
    var t=I("#cosToast");if(!t){t=document.createElement("div");t.id="cosToast";t.setAttribute("role","status");t.className="cos-toast";document.body.appendChild(t);}
    t.textContent=text;t.classList.add("on");clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove("on")},4200);
  }
  function noAi(){toast("A IA ao vivo só funciona pelo link publicado no claude.ai. Tudo que você digitou continua salvo neste navegador.");}

  // ---- Ficha do cliente — informações fixas, digitadas uma vez e salvas
  // automaticamente. Entram em TODOS os prompts (como fato) e na detecção do nicho. ----
  var FICHA_FIELDS=[
    ["name","Nome do cliente","Ex.: Consultório Dr. Paulo",0],
    ["niche","Nicho / segmento","Ex.: Odontologia estética",0],
    ["instagram","Instagram (@)","@perfil",0],
    ["site","Site / link","https://…",0],
    ["regiao","Cidade / região de atuação","Ex.: São Paulo — Zona Sul, ou 100% online",0],
    ["ticket","Ticket médio / faixa de preço","Ex.: R$ 1.500 a R$ 12.000",0],
    ["oferta","Produtos / serviços principais","Ex.: lentes de contato dental, clareamento",1],
    ["publico","Público-alvo","Ex.: mulheres de 30 a 50 anos que querem sorrir sem vergonha",1],
    ["tom","Tom de voz (palavras que usa e que evita)","Ex.: acolhedor, sem jargão; evita “barato” e “promoção”",1],
    ["restricoes","O que NÃO pode aparecer no conteúdo","Ex.: preço no feed, fotos de pacientes, nome de concorrentes",1],
    ["obs","Observações fixas","Datas importantes, pedidos recorrentes, aprovações…",1]
  ];
  function fichaVal(c,k){return k==="name"?(c.name||""):k==="niche"?(c.niche||""):((c.ficha||{})[k]||"");}
  function fichaFilled(c){return FICHA_FIELDS.filter(function(f){return fichaVal(c,f[0])}).length;}
  function fichaHtml(){
    var c=DB_CLIENTS[state.client]||{},n=fichaFilled(c);
    var fld=function(f){var v=esc(fichaVal(c,f[0]));
      return '<div class="fld"'+(f[3]?' style="grid-column:1/-1"':'')+'><label for="fc_'+f[0]+'">'+esc(f[1])+'</label>'+
        (f[3]?'<textarea class="ta" id="fc_'+f[0]+'" data-ficha="'+f[0]+'" style="min-height:58px" placeholder="'+esc(f[2])+'">'+v+'</textarea>':'<input id="fc_'+f[0]+'" data-ficha="'+f[0]+'" placeholder="'+esc(f[2])+'" value="'+v+'">')+'</div>';};
    return '<details class="card pad ficha" style="margin-bottom:16px"'+(n<4?' open':'')+'><summary><span class="bt" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--faint)">Ficha do cliente</span>'+
      '<span class="badge" style="margin-left:10px">'+n+'/'+FICHA_FIELDS.length+' preenchidos</span><span id="fichaMsg" style="margin-left:auto;font-size:12px;color:var(--muted)">'+(CAP.local?'Salvo neste navegador':'Salvo automaticamente')+'</span></summary>'+
      '<div style="font-size:11.5px;color:var(--faint);margin:10px 0 12px">Digite uma vez — fica gravado e todos os agentes usam como fato (Íris, Estratégia, Ideias, Formatos, Estúdio Criativo).</div>'+
      '<div class="grid cols-2" style="gap:0 16px">'+FICHA_FIELDS.map(fld).join('')+'</div></details>';
  }
  var fichaTimer=null;
  function wireFicha(){
    Array.prototype.forEach.call(document.querySelectorAll('[data-ficha]'),function(el){
      el.addEventListener('input',function(){
        var id=state.client,m=I("#fichaMsg");if(m){m.textContent="Salvando…";m.style.color="var(--muted)";}
        clearTimeout(fichaTimer);
        fichaTimer=setTimeout(function(){saveFicha(id);},600);
      });
    });
  }
  async function saveFicha(id){
    if(state.client!==id||!DB_CLIENTS[id])return;
    var rec=Object.assign({},DB_CLIENTS[id]),ficha=Object.assign({},rec.ficha||{});
    FICHA_FIELDS.forEach(function(f){var el=I("#fc_"+f[0]);if(!el)return;var v=el.value.trim();
      if(f[0]==="name"){if(v)rec.name=v;}else if(f[0]==="niche"){rec.niche=v;}else{ficha[f[0]]=v;}});
    rec.ficha=ficha;
    var m=I("#fichaMsg");
    try{
      await saveClientRecord(id,rec);
      if(m){m.textContent="✓ Salvo";m.style.color="var(--good)";}
    }catch(e){if(m){m.textContent="Não consegui salvar — tente de novo.";m.style.color="var(--warn)";}}
  }
  async function saveClientRecord(id,rec){
    rec.updatedAt=new Date().toISOString();
    await dbDoc("cos_clients/"+id).set(rec);
    DB_CLIENTS[id]=rec;
    var c=byId(id);
    if(c&&c.id===id){c.name=rec.name;c.niche=rec.niche||"";c.full=rec.name+(rec.niche?" — "+rec.niche:"");}
    refreshClientOptions();
    if(state.client===id){I("#csav").textContent=rec.name.charAt(0);var t=I("#dnaTitle");if(t)t.textContent="Content DNA — "+rec.name;}
  }
  function fichaCompact(){
    var c=DB_CLIENTS[state.client];if(!c)return "";
    var lines=FICHA_FIELDS.filter(function(f){return f[0]!=="name"}).map(function(f){var v=fichaVal(c,f[0]);return v?('- '+f[1]+': '+v):''}).filter(Boolean);
    var br=String(c.briefing||"").trim();
    return [lines.length?('FICHA DO CLIENTE (informada pelo estrategista — trate como FACT e respeite as restrições):\n'+lines.join('\n')):'',
      br?('BRIEFING DO CLIENTE (palavras do próprio cliente — use como fonte; não invente além disso):\n'+br.slice(0,3500)):''].filter(Boolean).join('\n\n');
  }
  var briefTimer=null;
  function wireBriefingAutosave(){
    var ta=I("#dnaBriefing");if(!ta)return;
    ta.addEventListener('input',function(){
      var id=state.client;clearTimeout(briefTimer);
      briefTimer=setTimeout(function(){
        if(state.client!==id||!DB_CLIENTS[id])return;
        var rec=Object.assign({},DB_CLIENTS[id],{briefing:ta.value});
        saveClientRecord(id,rec).then(function(){var m=I("#briefSaved");if(m)m.textContent="✓ Briefing salvo";},function(){});
      },800);
    });
  }

  // ---- Rascunho × IA — peça sem IA nunca se passa por texto final ----
  function isRascunho(c){return !!c&&(c.origem==="rascunho"||(!c.origem&&/ancorado no Content DNA do cliente/.test((c.copy||"")+" "+((c.roteiro||[]).map(function(s){return s.text}).join(" ")))));}
  function rascunhoBadge(c){return isRascunho(c)?'<span class="badge rasc" title="Escrito sem IA — base para revisar, não publicar assim">✎ rascunho</span>':'';}

  // ---- Memória de voz: peças que você aprova ou edita viram exemplo para as próximas ----
  async function recordExample(id,tipo,headline,texto,fonte){
    if(!CAP.db||!isDbClient(id)||!texto)return;
    var g=DB_STATE_CACHE[id]||GENERATED||{},items=(g.exemplos||[]).slice();
    items.unshift({tipo:tipo,headline:String(headline||""),texto:String(texto).slice(0,1200),fonte:fonte,at:new Date().toISOString()});
    items=items.slice(0,6);
    try{await dbDoc("cos_exemplos/"+id).set({items:items});}catch(e){return;}
    if(DB_STATE_CACHE[id])DB_STATE_CACHE[id].exemplos=items;
    if(state.client===id&&GENERATED)GENERATED.exemplos=items;
  }
  function exemplosCompact(){
    var ex=(GENERATED&&GENERATED.exemplos)||[];if(!ex.length)return "";
    return '\n\nEXEMPLOS APROVADOS PELO ESTRATEGISTA (a voz real deste cliente — imite ritmo, vocabulário e tom; NÃO copie o conteúdo nem repita as mesmas frases):\n'+
      ex.map(function(x,i){return (i+1)+'. ['+x.tipo+(x.fonte?' · '+x.fonte:'')+'] '+x.headline+'\n'+x.texto.slice(0,600)}).join('\n\n');
  }

  // ---- Resultados reais (colados por você) → guia de formatos ----
  var MET_FIELDS=[["alcance","Alcance"],["salvamentos","Salvamentos"],["compartilhamentos","Compartilhamentos"],["comentarios","Comentários"],["seguidores","Seguidores ganhos"]];
  function metricsBlockHtml(it,idx){
    var m=it.metrics||{};
    return '<div class="block"><div class="bt">📈 Resultado depois de publicar <span class="tag-mock">cole os números do Instagram</span></div>'+
      '<div class="grid cols-3" style="gap:0 12px">'+MET_FIELDS.map(function(f){return '<div class="fld"><label for="mt_'+f[0]+'">'+f[1]+'</label><input id="mt_'+f[0]+'" type="number" min="0" inputmode="numeric" value="'+(m[f[0]]!=null?esc(m[f[0]]):'')+'"></div>'}).join('')+'</div>'+
      '<button class="btn" id="saveMetBtn" data-idx="'+idx+'">Salvar resultado</button><span id="metMsg" style="margin-left:10px;font-size:12px;color:var(--muted)">'+(m.at?'Último registro: '+esc(String(m.at).slice(0,10)):'Os resultados ensinam o guia de Formatos o que funciona para este cliente.')+'</span></div>';
  }
  async function saveMetrics(idx){
    var it=GENERATED.calendar.items[idx];if(!it)return;
    var m={at:new Date().toISOString()};
    MET_FIELDS.forEach(function(f){var el=I("#mt_"+f[0]);var v=el&&el.value!==''?Math.max(0,+el.value):null;if(v!=null&&!isNaN(v))m[f[0]]=v;});
    var msg=I("#metMsg");
    if(!m.alcance){if(msg){msg.textContent="Informe ao menos o alcance.";msg.style.color="var(--warn)";}return;}
    try{
      await dbItemsCol("cos_calendar",state.client).doc(it.id).update({metrics:m});
      it.metrics=m;
      if(msg){msg.textContent="✓ Resultado salvo — já conta no guia de Formatos";msg.style.color="var(--good)";}
    }catch(e){if(msg){msg.textContent="Não consegui salvar — tente de novo.";msg.style.color="var(--warn)";}}
  }
  function itemFormato(it){var x=it.idea||{};return (x.formatRec&&x.formatRec.formato)||x.format||"—";}
  // Agrupa por formato: engajamento = (salvamentos + compartilhamentos + comentários) / alcance.
  function formatPerformance(){
    var items=((GENERATED&&GENERATED.calendar&&GENERATED.calendar.items)||[]).filter(function(it){return it.metrics&&it.metrics.alcance>0});
    var by={};
    items.forEach(function(it){var k=itemFormato(it),m=it.metrics,b=by[k]=by[k]||{formato:k,n:0,alcance:0,inter:0,salv:0};
      b.n++;b.alcance+=m.alcance;b.salv+=(m.salvamentos||0);b.inter+=(m.salvamentos||0)+(m.compartilhamentos||0)+(m.comentarios||0);});
    return Object.keys(by).map(function(k){var b=by[k];return {formato:b.formato,n:b.n,alcanceMedio:Math.round(b.alcance/b.n),eng:b.inter/b.alcance,salvRate:b.salv/b.alcance}})
      .sort(function(a,b){return b.eng-a.eng});
  }
  function pct(x){return (Math.round(x*1000)/10).toLocaleString('pt-BR')+'%';}
  function perfCompact(){
    var p=formatPerformance();if(!p.length)return "";
    return 'DESEMPENHO REAL deste cliente por formato (engajamento = salvamentos+compartilhamentos+comentários ÷ alcance; poucos posts = sinal fraco): '+
      p.map(function(r){return r.formato+' '+pct(r.eng)+' ('+r.n+' post'+(r.n>1?'s':'')+', alcance médio '+r.alcanceMedio+')'}).join('; ');
  }
  function perfCardHtml(){
    var p=formatPerformance();
    if(!p.length)return '<div class="card pad" style="margin-top:14px"><div class="eyebrow" style="margin-bottom:6px">📈 O que os seus dados dizem</div><div style="font-size:12.5px;color:var(--muted)">Ainda sem resultados. Depois de publicar, abra o conteúdo no Calendário e cole alcance, salvamentos e compartilhamentos — o guia passa a mostrar quais formatos funcionam <b>para este cliente</b>, não só para o nicho.</div></div>';
    var tot=p.reduce(function(a,r){return a+r.n},0);
    return '<div class="card pad" style="margin-top:14px"><div class="eyebrow" style="margin-bottom:10px">📈 O que os seus dados dizem · '+tot+' post'+(tot>1?'s':'')+' medido'+(tot>1?'s':'')+'</div>'+
      p.map(function(r,i){return '<div class="fnbar"><span class="fnl" style="flex:0 0 190px">'+(i===0?'🏆 ':'')+esc(r.formato)+' <span style="color:var(--faint);font-size:10.5px">· '+r.n+'</span></span><span class="fnt"><i style="width:'+Math.min(100,r.eng/p[0].eng*100)+'%"></i></span><span class="fnv tnum" style="flex:0 0 60px">'+pct(r.eng)+'</span></div>'}).join('')+
      '<div style="font-size:11.5px;color:var(--faint);margin-top:8px">Engajamento = (salvamentos + compartilhamentos + comentários) ÷ alcance. '+(tot<6?'Com poucos posts por formato, trate como sinal inicial — não como regra.':'Use para ajustar o mix do próximo mês.')+'</div></div>';
  }

  // ---- Próximos passos: o painel guia o que falta para cada cliente ----
  function nextStepsHtml(){
    if(!state.client||!isDbClient(state.client))return '';
    var g=GENERATED||{},c=DB_CLIENTS[state.client]||{};
    var items=(g.calendar&&g.calendar.items)||[];
    var steps=[
      ["dna","Preencher a Ficha do cliente",fichaFilled(c)>=5],
      ["dna","Montar o Content DNA (Íris ou manual)",(g.dna||[]).length>=5],
      ["strategy","Gerar a Estratégia",!!g.strategy],
      ["editorial","Gerar a Linha Editorial",(g.editorial||[]).length>0],
      ["ideas","Gerar as Ideias",(g.ideas||[]).length>0],
      ["formats","Conferir o guia de Formatos do nicho",!!(g.formats&&(g.formats.perfil||g.formats.ia))],
      ["calendar","Montar o Calendário",items.length>0],
      ["calendar","Produzir a primeira peça com IA",items.some(function(it){return it.content&&!isRascunho(it.content)})],
      ["calendar","Registrar resultados publicados",items.some(function(it){return it.metrics&&it.metrics.alcance})]
    ];
    var done=steps.filter(function(s){return s[2]}).length,next=steps.filter(function(s){return !s[2]})[0];
    var falta=(g.dna||[]).length>=3&&!state.clientView&&AUTO_STEPS.some(function(st){return st[0]!=="dna"&&!autoFeito(st[0],g)});
    return '<div class="card pad" style="margin-top:16px"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px"><div class="eyebrow">Próximos passos — '+esc(clientName(state.client))+'</div><span class="badge">'+done+'/'+steps.length+'</span>'+
      (falta?'<button class="btn pri genbtn" id="autoBuildBtn" style="margin-left:auto">✦ Montar o restante automaticamente</button>':'')+
      (next?'<button class="btn '+(falta?'':'pri ')+'genbtn" data-goto-step="'+next[0]+'" style="'+(falta?'':'margin-left:auto')+'">Continuar: '+esc(next[1])+' →</button>':'<span class="badge act" style="margin-left:auto">✓ Cliente completo</span>')+'</div>'+
      '<div class="steplist">'+steps.map(function(s){return '<a class="stepi'+(s[2]?' ok':'')+'" data-goto-step="'+s[0]+'"><span class="dot">'+(s[2]?'✓':'')+'</span>'+esc(s[1])+'</a>'}).join('')+'</div></div>';
  }
  function wireSteps(root){var ab=(root||document).querySelector('#autoBuildBtn');if(ab)ab.addEventListener('click',function(){montarTudo(state.client,state.period||30)});Array.prototype.forEach.call((root||document).querySelectorAll('[data-goto-step]'),function(b){b.addEventListener('click',function(){go(b.getAttribute('data-goto-step'))})});}

  // ---- Backup: leva seus clientes entre o link publicado e a cópia offline
  // (ou guarda uma cópia de segurança). ----
  var BK_DOCS=["cos_dna","cos_strategy","cos_editorial","cos_research","cos_refs","cos_formats","cos_exemplos","cos_meta"],BK_COLS=["cos_ideas","cos_calendar"];
  async function exportBackup(){
    var out={app:"content-os",v:1,at:new Date().toISOString(),clients:[]};
    for(var id in DB_CLIENTS){
      var e={client:DB_CLIENTS[id],docs:{},cols:{}};
      for(var i=0;i<BK_DOCS.length;i++){var s=await dbDoc(BK_DOCS[i]+"/"+id).get();if(s.exists)e.docs[BK_DOCS[i]]=s.data();}
      for(var j=0;j<BK_COLS.length;j++){var sn=await dbItemsCol(BK_COLS[j],id).get();e.cols[BK_COLS[j]]=sn.docs.map(function(d){return d.data()});}
      out.clients.push(e);
    }
    return out;
  }
  async function importBackup(data){
    if(!data||data.app!=="content-os"||!Array.isArray(data.clients))throw new Error("arquivo inválido");
    for(var i=0;i<data.clients.length;i++){
      var e=data.clients[i],c=e.client;if(!c||!c.id)continue;
      await dbDoc("cos_clients/"+c.id).set(c);
      for(var k in (e.docs||{}))if(BK_DOCS.indexOf(k)>=0)await dbDoc(k+"/"+c.id).set(e.docs[k]);
      for(var k2 in (e.cols||{}))if(BK_COLS.indexOf(k2)>=0){var items=e.cols[k2]||[];for(var n=0;n<items.length;n++){var it=items[n];await dbItemsCol(k2,c.id).doc(String(it.id||("item-"+n))).set(it);}}
      delete DB_STATE_CACHE[c.id];
    }
    await loadDbClients();
    return data.clients.length;
  }
  function backupHtml(){
    return '<div class="card pad" style="margin-bottom:14px"><div class="eyebrow" style="margin-bottom:8px">Backup dos clientes</div>'+
      '<div style="font-size:12.5px;color:var(--muted);margin-bottom:12px">'+(CAP.local?'Você está na <b>cópia offline</b>: os clientes ficam salvos neste navegador. ':'Os clientes ficam salvos no painel publicado. ')+'Exporte um arquivo para ter uma cópia de segurança ou para levar tudo entre o link publicado e a cópia offline.</div>'+
      '<button class="btn" id="bkExport">⬇ Exportar backup (.json)</button> <label class="btn" style="display:inline-block">⬆ Importar backup<input type="file" id="bkImport" accept="application/json,.json" hidden></label><span id="bkMsg" style="margin-left:10px;font-size:12px;color:var(--muted)"></span></div>';
  }
  function wireBackup(){
    var msg=function(t,c){var m=I("#bkMsg");if(m){m.textContent=t;m.style.color=c||"var(--muted)";}};
    var ex=I("#bkExport");if(ex)ex.addEventListener('click',async function(){
      if(!CAP.db)return;msg("Preparando…");
      try{
        var bkData=await exportBackup();try{bkData.settings=await adminCfg();await salvarAdminCfg({lastBackup:new Date().toISOString()});}catch(e){}
        var json=JSON.stringify(bkData,null,1),name="content-os-backup-"+new Date().toISOString().slice(0,10)+".json";
        var localDL=function(){var b=new Blob([json],{type:"application/json"});var a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();document.body.removeChild(a);msg("✓ Backup baixado","var(--good)");};
        if(window.claude&&claude.use){claude.use("downloads").then(function(dl){if(!dl){localDL();return;}dl.save({filename:name,data:json}).then(function(){msg("✓ Backup baixado","var(--good)")},function(){msg("Download recusado.","var(--warn)")});},localDL);}else{localDL();}
      }catch(e){msg("Não consegui exportar — tente de novo.","var(--warn)");}
    });
    var im=I("#bkImport");if(im)im.addEventListener('change',function(){
      var f=im.files&&im.files[0];if(!f)return;msg("Importando…");
      f.text().then(function(t){return importBackup(JSON.parse(t));}).then(function(n){msg("✓ "+n+" cliente(s) importado(s)","var(--good)");renderClients();},function(){msg("Arquivo inválido — use um backup exportado por este painel.","var(--warn)");});
    });
  }

  async function initCapabilities(){
    try{
      if(window.claude&&window.claude.use){
        CAP.sample=await window.claude.use("sample");
        CAP.db=await window.claude.use("db");
      }
    }catch(e){}
    if(!CAP.db){CAP.db=localDb();CAP.local=true;}
    CAP.ready=true;
    if(CAP.db){try{await loadDbClients();}catch(e){}}
    renderAiBadge();
    if(isDbClient(state.client))renderView(state.view);
  }
  function renderAiBadge(){
    var el=I("#aiBadge");if(!el)return;
    var on=aiAvailable();
    el.textContent=on?"● ativa":(CAP.local?"○ offline · salvo aqui":"○ indisponível");
    el.style.color=on?"var(--fact)":"var(--faint)";
    el.title=on?"Gerar com IA real e cadastrar clientes está disponível neste painel.":"Abra pelo link do painel publicado no claude.ai para gerar com IA real e cadastrar clientes — a cópia offline não tem essa capacidade.";
  }
  async function loadDbClients(){
    var snap=await CAP.db.collection("cos_clients").get();
    DB_CLIENTS={};
    snap.docs.forEach(function(d){var v=d.data();if(v&&v.id)DB_CLIENTS[v.id]=v;});
    var added=false;
    Object.keys(DB_CLIENTS).forEach(function(id){
      if(!CLIENTS.some(function(c){return c.id===id})){
        var v=DB_CLIENTS[id];
        CLIENTS.push({id:id,name:v.name,full:v.name+(v.niche?" — "+v.niche:""),niche:v.niche||"",av:(CLIENTS.length%9)});
        added=true;
      }
    });
    if(added){refreshClientOptions();renderClients();}
    // Abre no último cliente usado (ou no primeiro), em vez de ficar em branco.
    if(!state.client&&CLIENTS.length){var last="";try{last=localStorage.getItem("cos_last_client")||"";}catch(e){}
      var alvo=CLIENTS.some(function(c){return c.id===last})?last:CLIENTS[0].id;setClient(alvo);}
  }
  function genClientId(name){
    var slug=(name||"cliente").toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,24)||'cliente';
    return slug+'-'+Math.random().toString(36).slice(2,7);
  }
  async function createClient(name,niche){
    var id=genClientId(name);
    var rec={id:id,name:name,niche:niche||"",createdAt:new Date().toISOString()};
    await dbDoc("cos_clients/"+id).set(rec);
    DB_CLIENTS[id]=rec;
    CLIENTS.push({id:id,name:name,full:name+(niche?" — "+niche:""),niche:niche||"",av:(CLIENTS.length%9)});
    refreshClientOptions();
    return id;
  }
  function blankClientState(id,name){
    return {clientId:id,clientName:name,generatedAt:null,provider:"sample",
      dna:[],strategy:null,research:[],editorial:[],ideas:[],refs:[],formats:null,exemplos:[],
      calendar:{total:0,mix:{topo:0,meio:0,fundo:0},items:[]},notion:[],performance:[],
      libraries:LIB,warnings:[]};
  }
  async function loadDbClientState(id){
    var c=DB_CLIENTS[id]||{name:clientName(id)};
    var g=blankClientState(id,c.name);
    if(!CAP.db)return g;
    try{
      var dnaDoc=await dbDoc("cos_dna/"+id).get();if(dnaDoc.exists)g.dna=(dnaDoc.data()||{}).entries||[];
      var stratDoc=await dbDoc("cos_strategy/"+id).get();if(stratDoc.exists)g.strategy=stratDoc.data();
      var edDoc=await dbDoc("cos_editorial/"+id).get();if(edDoc.exists)g.editorial=(edDoc.data()||{}).pilares||[];
      var resDoc=await dbDoc("cos_research/"+id).get();if(resDoc.exists)g.research=(resDoc.data()||{}).items||[];
      var refsDoc=await dbDoc("cos_refs/"+id).get();if(refsDoc.exists)g.refs=(refsDoc.data()||{}).items||[];
      var fmtDoc=await dbDoc("cos_formats/"+id).get();if(fmtDoc.exists)g.formats=fmtDoc.data();
      var exDoc=await dbDoc("cos_exemplos/"+id).get();if(exDoc.exists)g.exemplos=(exDoc.data()||{}).items||[];
      var ideasSnap=await dbItemsCol("cos_ideas",id).get();g.ideas=ideasSnap.docs.map(function(d){return d.data()}).sort(function(a,b){return (a.ord||0)-(b.ord||0)});
      var calSnap=await dbItemsCol("cos_calendar",id).get();g.calendar.items=calSnap.docs.map(function(d){return d.data()}).sort(function(a,b){return (a.ord||0)-(b.ord||0)});
      g.calendar.total=g.calendar.items.length;
    }catch(e){}
    DB_STATE_CACHE[id]=g;
    return g;
  }

  function setClient(id){var c=byId(id);state.client=id;try{if(id)localStorage.setItem("cos_last_client",id);}catch(e){}I("#csav").textContent=c.name.charAt(0);I("#csav").style.background=avc(c.av);
    var sel=I("#csel");if(sel&&sel.value!==id)sel.value=id;
    if(isDbClient(id)){
      GENERATED=DB_STATE_CACHE[id]||blankClientState(id,c.name);
      renderKpis();go(state.view);
      loadDbClientState(id).then(function(g){if(state.client===id&&state.autoRunning!==id){GENERATED=g;renderKpis();renderView(state.view);}});
      return;
    }
    GENERATED=(GENERATED_ALL||{})[id]||null;
    renderKpis();if(state.view)go(state.view);
  }
  function refreshClientOptions(){
    var opts=CLIENTS.length?((state.client?'':'<option value="">Escolha um cliente…</option>')+CLIENTS.map(function(c){return '<option value="'+c.id+'">'+esc(c.full)+'</option>'}).join('')):'<option value="">Nenhum cliente ainda</option>';
    I("#csel").innerHTML=opts;
    var sel=I("#csel");if(sel.value!==state.client)sel.value=state.client;
  }
  function buildClientSelect(){
    refreshClientOptions();
    I("#csel").addEventListener('change',function(){setClient(this.value)});
    setClient(state.client);
  }
  function initTheme(){var root=document.documentElement,saved=null;try{saved=localStorage.getItem('cos-theme')}catch(e){}if(saved)root.setAttribute('data-theme',saved);
    I("#theme").addEventListener('click',function(){var cur=root.getAttribute('data-theme');var dark=cur?cur==="dark":window.matchMedia('(prefers-color-scheme: dark)').matches;var nx=dark?"light":"dark";root.setAttribute('data-theme',nx);try{localStorage.setItem('cos-theme',nx)}catch(e){}})}

  buildNav();renderPipe();renderKpis();renderOverviewContent();renderClients();renderContentList();renderApprovals();renderCal();renderPerf();renderKB();renderAgents();
  buildClientSelect();initTheme();
  I("#clientview").addEventListener('click',function(){toggleClientView(!state.clientView)});
  I("#newClientBtn").addEventListener('click',openNewClientModal);
  I("#ncHeroBtn").addEventListener('click',openNewClientModal);
  go("overview");
  initCapabilities();
})();
