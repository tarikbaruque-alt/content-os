  // ---------- Clientes ativos (ADMINISTRATIVO, nunca aparece na visão do cliente nem nos arquivos enviados) ----------
  // Usa o mesmo cadastro (cos_clients): os dados administrativos ficam em rec.admin; o @ fica na ficha.
  var MESES_LONGOS=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  var COBRANCA_PADRAO="Oi, [nome]! Tudo bem? Passando para lembrar do investimento de [valor] referente a [mes], com vencimento no dia [dia]. Qualquer dúvida é só me chamar. Obrigado pela parceria! 🙌";
  var ADMIN_CFG=null;
  function adminOf(c){var a=(c&&c.admin)||{};return {ativo:a.ativo!==false,contato:a.contato||"",whats:a.whats||"",valor:+a.valor||0,venc:+a.venc||10,pagos:a.pagos||{}};}
  function brl(v){return (+v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});}
  function mesChave(d){d=d||new Date();return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2);}
  function waLink(n,txt){var d=String(n||"").replace(/\D/g,"");if(!d)return "";if(d.length<=11)d="55"+d;return "https://wa.me/"+d+(txt?"?text="+encodeURIComponent(txt):"");}
  async function adminCfg(){if(ADMIN_CFG)return ADMIN_CFG;try{var d=await dbDoc("cos_settings/admin").get();ADMIN_CFG=d.exists?(d.data()||{}):{};}catch(e){ADMIN_CFG={};}return ADMIN_CFG;}
  async function salvarAdminCfg(patch){ADMIN_CFG=Object.assign({},await adminCfg(),patch);await dbDoc("cos_settings/admin").set(ADMIN_CFG);}
  function msgCobranca(c,tpl){var a=adminOf(c),d=new Date();return String(tpl||COBRANCA_PADRAO).replace(/\[nome\]/gi,a.contato||c.name||"").replace(/\[valor\]/gi,brl(a.valor)).replace(/\[mes\]/gi,MESES_LONGOS[d.getMonth()]).replace(/\[dia\]/gi,String(a.venc));}
  function cobrancasPendentes(){var hoje=new Date().getDate(),mes=mesChave();
    return Object.keys(DB_CLIENTS).map(function(id){return DB_CLIENTS[id]}).filter(function(c){var a=adminOf(c);return a.ativo&&a.valor>0&&hoje>=a.venc&&!a.pagos[mes];});}
  async function salvarAdmin(id,patch){var rec=DB_CLIENTS[id];if(!rec)return;var a=Object.assign({},rec.admin||{},patch);await saveClientRecord(id,Object.assign({},rec,{admin:a}));}
  function renderCobrancaBanner(){var el=I("#ovCobranca");if(!el)return;if(state.clientView){el.innerHTML="";return;}
    var p=cobrancasPendentes();if(!p.length){el.innerHTML="";return;}
    var tot=p.reduce(function(s,c){return s+adminOf(c).valor},0);
    el.innerHTML='<div class="aviso-l"><div class="l-main"><b>Cobranças atrasadas</b><small>'+p.length+' cliente'+(p.length>1?'s':'')+' com vencimento já passado este mês, somando '+brl(tot)+'.</small></div><button class="btn" data-goto="ativos">Ver cobranças</button></div>';
    var b=el.querySelector('[data-goto]');if(b)b.addEventListener('click',function(){state.ativosOpen=null;go("ativos");});}
  function renderAtivos(){
    var el=I('.view[data-view="ativos"]');if(!el)return;
    if(state.clientView){el.innerHTML="";return;}
    if(state.ativosOpen&&DB_CLIENTS[state.ativosOpen]){renderClientePagina(el,state.ativosOpen);return;}
    var filtro=state.ativosFiltro||"ativos",mes=mesChave(),hoje=new Date().getDate();
    var todos=Object.keys(DB_CLIENTS).map(function(id){return DB_CLIENTS[id]}).sort(function(a,b){return String(a.name).localeCompare(String(b.name),"pt-BR")});
    var ativos=todos.filter(function(c){return adminOf(c).ativo}),inat=todos.length-ativos.length;
    var receita=ativos.reduce(function(s,c){return s+adminOf(c).valor},0),comValor=ativos.filter(function(c){return adminOf(c).valor>0}),pagos=comValor.filter(function(c){return adminOf(c).pagos[mes]}).length;
    var lista=filtro==="todos"?todos:filtro==="inativos"?todos.filter(function(c){return !adminOf(c).ativo}):ativos;
    var pend=cobrancasPendentes();
    var h='<div class="stat-cards">'+kpiCard("Clientes ativos",String(ativos.length),inat?inat+' inativo'+(inat>1?'s':'')+' com histórico guardado':'nenhum inativo')+
      kpiCard("Receita mensal",brl(receita),comValor.length?'média de '+brl(receita/comValor.length)+' por cliente':'cadastre o valor de cada cliente')+
      kpiCard("Recebidos em "+MESES_LONGOS[new Date().getMonth()],pagos+' de '+comValor.length,pend.length?pend.length+' cobrança'+(pend.length>1?'s':'')+' pendente'+(pend.length>1?'s':''):'nada pendente até hoje')+'</div>';
    if(pend.length){h+=quadro("Cobranças do mês","Vencimento já passou e ainda não foi marcado como recebido.",'<button class="btn" id="atTpl">Mensagem de cobrança</button>',
      pend.map(function(c){var a=adminOf(c);return '<div class="linha"><div class="l-main"><b>'+esc(c.name)+'</b><small>'+brl(a.valor)+', vence dia '+a.venc+'</small></div>'+
        (a.whats?'<button class="btn" data-at-cobrar="'+esc(c.id)+'">Cobrar no WhatsApp</button>':'<button class="btn" data-at-copiar="'+esc(c.id)+'">Copiar mensagem</button>')+'<button class="btn pri" data-at-pago="'+esc(c.id)+'">Recebido</button></div>'}).join(''));}
    h+='<div class="toolbar"><div class="subtabs">'+[["ativos","Ativos ("+ativos.length+")"],["inativos","Inativos ("+inat+")"],["todos","Todos ("+todos.length+")"]].map(function(f){return '<button class="sub atFiltro'+(filtro===f[0]?' on':'')+'" data-f="'+f[0]+'">'+f[1]+'</button>'}).join('')+'</div>'+
      '<span class="spacer"></span><button class="btn" id="atGcal" title="Cria um lembrete que se repete todo mês na sua Google Agenda">Lembrete mensal de cobrança</button></div>';
    h+=lista.length?'<div class="tabela"><table><thead><tr><th>Cliente</th><th>Situação</th><th>Contato</th><th>Valor mensal</th><th>Este mês</th><th></th></tr></thead><tbody>'+lista.map(function(c){var a=adminOf(c),f=c.ficha||{},ig=String(f.instagram||"").trim(),brief=!!String(c.briefing||"").trim();
      return '<tr data-at-open="'+esc(c.id)+'"'+(a.ativo?'':' class="apagada"')+'><td><div class="cel-cli"><span class="av-cli" style="background:'+avc((byId(c.id)||{}).av||0)+'">'+esc(String(c.name||"?").charAt(0))+'</span><span><b>'+esc(c.name)+'</b><small>'+esc(c.niche||"sem nicho")+'</small></span></div></td>'+
        '<td><span class="chip '+(a.ativo?'act':'')+'">'+(a.ativo?'Ativo':'Inativo')+'</span></td>'+
        '<td>'+(ig?esc(ig.charAt(0)==="@"?ig:"@"+ig):'<small>sem Instagram</small>')+(a.whats?'<small><a class="lnk" href="'+waLink(a.whats)+'" target="_blank" rel="noopener" data-stop>'+esc(a.whats)+'</a></small>':'<small>sem WhatsApp</small>')+'</td>'+
        '<td class="tnum">'+(a.valor?brl(a.valor)+'<small>vence dia '+a.venc+'</small>':'<small>sem valor</small>')+'</td>'+
        '<td>'+(a.valor?'<span class="chip '+(a.pagos[mes]?'act':(hoje>=a.venc?'warn':''))+'">'+(a.pagos[mes]?'Recebido':(hoje>=a.venc?'Pendente':'A vencer'))+'</span>':'')+'</td>'+
        '<td class="acao nowrap">'+(brief?'':'<button class="btn" data-at-brief="'+esc(c.id)+'">Adicionar briefing</button>')+'<button class="icon-btn sm" data-at-edit="'+esc(c.id)+'" title="Editar" aria-label="Editar">'+iconeUI("edit")+'</button><button class="btn ghost" data-at-toggle="'+esc(c.id)+'">'+(a.ativo?'Marcar inativo':'Reativar')+'</button></td></tr>';}).join('')+'</tbody></table></div>':
      vazioQuadro(filtro==="inativos"?'Nenhum cliente inativo.':'Nenhum cliente ainda.',filtro==="inativos"?'':'Cadastre um cliente ou receba um briefing na aba Clientes.');
    el.innerHTML=h;
    var an=I("#atNovo");if(an)an.addEventListener('click',openNewClientModal);
    var gcb=I("#atGcal");if(gcb)gcb.addEventListener('click',openGcalCobranca);
    var tb=I("#atTpl");if(tb)tb.addEventListener('click',openTplCobranca);
    Array.prototype.forEach.call(el.querySelectorAll('.atFiltro'),function(b){b.addEventListener('click',function(){state.ativosFiltro=b.getAttribute('data-f');renderAtivos();})});
    el.onclick=async function(e){var t=e.target;if(t.closest('[data-stop]'))return;var b=t.closest('[data-at-edit],[data-at-toggle],[data-at-brief],[data-at-pago],[data-at-cobrar],[data-at-copiar]');
      if(b){e.stopPropagation();
        if(b.hasAttribute('data-at-edit')){openEditCliente(b.getAttribute('data-at-edit'));return;}
        if(b.hasAttribute('data-at-toggle')){var id=b.getAttribute('data-at-toggle'),at=adminOf(DB_CLIENTS[id]).ativo;await salvarAdmin(id,{ativo:!at});toast(at?"Cliente marcado como inativo, histórico guardado.":"Cliente reativado.");renderAtivos();return;}
        if(b.hasAttribute('data-at-brief')){abrirPaginaCliente(b.getAttribute('data-at-brief'),true);return;}
        if(b.hasAttribute('data-at-pago')){var id2=b.getAttribute('data-at-pago'),pg=Object.assign({},adminOf(DB_CLIENTS[id2]).pagos);pg[mesChave()]=new Date().toISOString();await salvarAdmin(id2,{pagos:pg});toast("Pagamento de "+MESES_LONGOS[new Date().getMonth()]+" marcado como recebido.");renderAtivos();renderCobrancaBanner();return;}
        var id3=b.getAttribute('data-at-cobrar')||b.getAttribute('data-at-copiar'),c3=DB_CLIENTS[id3],cfg=await adminCfg(),txt=msgCobranca(c3,cfg.tplCobranca);
        if(b.hasAttribute('data-at-cobrar')){window.open(waLink(adminOf(c3).whats,txt),"_blank");return;}
        if(navigator.clipboard)navigator.clipboard.writeText(txt).then(function(){toast("Mensagem copiada.")},function(){toast(txt)});else toast(txt);return;}
      var card=t.closest('[data-at-open]');if(card)abrirPaginaCliente(card.getAttribute('data-at-open'),false);};
  }
  function abrirPaginaCliente(id,focoBriefing){state.ativosOpen=id;state.ativosBrief=!!focoBriefing;if(state.client!==id)setClient(id);else renderAtivos();}
  function renderClientePagina(el,id){
    var c=DB_CLIENTS[id],a=adminOf(c),f=c.ficha||{},g=(state.client===id&&GENERATED)||DB_STATE_CACHE[id]||{},st=g.strategy,ed=g.editorial||[],items=(g.calendar&&g.calendar.items)||[],r=rotinaOf(id);
    var brief=String(c.briefing||"").trim(),ig=String(f.instagram||"").trim();
    var prox=items.filter(function(it){return isIsoDate(it.data)&&it.data>=fmtD(new Date())}).sort(function(x,y){return (x.data+itemHora(x,r))<(y.data+itemHora(y,r))?-1:1}).slice(0,5);
    var aprov=items.filter(function(it){return it.clientStatus==="aprovado"}).length,ajuste=items.filter(function(it){return it.clientStatus==="ajuste"}).length;
    var sec=function(t,body,acao){return '<div class="card pad" style="margin-bottom:14px"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px"><div class="bt" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--faint)">'+t+'</div><span style="flex:1"></span>'+(acao||'')+'</div>'+body+'</div>'};
    var h='<div style="margin:4px 0 14px"><button class="btn ghost" id="cpVoltar">← Clientes ativos</button></div>'+
      '<div class="card pad" style="margin-bottom:14px;display:flex;gap:14px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:220px"><h3 style="font-size:22px">'+esc(c.name)+' <span class="badge '+(a.ativo?'act':'')+'" style="vertical-align:middle">'+(a.ativo?'Ativo':'Inativo')+'</span></h3><div style="color:var(--muted);font-size:13px;margin-top:3px">'+esc(c.niche||"")+(ig?' · '+esc(ig.charAt(0)==="@"?ig:"@"+ig):'')+(a.whats?' · <a href="'+waLink(a.whats)+'" target="_blank" rel="noopener">'+esc(a.whats)+'</a>':'')+'</div></div>'+
      '<div style="text-align:right"><div style="font-family:var(--font-display);font-weight:700;font-size:20px">'+(a.valor?brl(a.valor)+'<span style="font-size:13px;color:var(--faint)">/mês</span>':'')+'</div><div style="font-size:12px;color:var(--muted)">'+(a.valor?'vence dia '+a.venc+(a.pagos[mesChave()]?' · recebido este mês':''):'')+'</div></div><button class="btn" id="cpEdit">Editar dados</button></div>';
    var bBody=brief?'<div class="copybox" style="max-height:220px;overflow:auto">'+esc(brief)+'</div>':
      '<div class="empty-hero" style="padding:22px 10px"><div class="eh-t" style="margin-bottom:12px">Este cliente ainda não tem briefing. O briefing alimenta o Content DNA, a estratégia, a linha editorial e as ideias.</div><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><button class="btn pri" id="cpForm">📨 Enviar formulário ao cliente</button><button class="btn" id="cpColar">Colar briefing recebido</button><button class="btn" id="cpEscrever">✍️ Escrever agora</button></div></div>';
    h+=sec("Briefing",bBody+'<div id="cpBriefEdit" hidden style="margin-top:10px"><textarea class="ta" id="cpBriefTxt" style="min-height:160px" placeholder="O que o cliente vende, público, dores, desejos, objeções, diferencial, provas, tom de voz, objetivos…">'+esc(brief)+'</textarea><div style="display:flex;gap:8px;margin-top:8px;align-items:center"><button class="btn pri" id="cpBriefSalvar">Salvar briefing</button><span id="cpBriefMsg" style="font-size:12px;color:var(--muted)"></span></div></div>',
      brief?'<button class="btn" id="cpEscrever2">Editar</button><button class="btn" id="cpColar2">Importar outro</button>':'');
    h+=sec("Estratégia",st?'<div style="font-size:13.5px"><b>Posicionamento:</b> '+esc(st.posicionamento||"")+'</div>'+(st.bigMessage?'<div style="font-family:var(--font-display);font-weight:700;color:var(--brand-ink);margin-top:6px">“'+esc(st.bigMessage)+'”</div>':'')+((st.pilares||[]).length?'<div class="chips" style="margin-top:8px">'+st.pilares.map(function(p){return '<span class="badge">'+esc(String(p).split(":")[0])+'</span>'}).join('')+'</div>':''):'<div style="font-size:13px;color:var(--muted)">Ainda não gerada.</div>','<button class="btn" data-cp-go="strategy">Abrir</button>');
    h+=sec("Linha editorial",ed.length?ed.map(function(p){return '<div style="margin-bottom:6px"><b>'+esc(p.pilar||"")+'</b> <span style="color:var(--muted);font-size:12.5px">'+esc((p.temas||[]).map(function(t){return t.tema}).join(" · "))+'</span></div>'}).join(''):'<div style="font-size:13px;color:var(--muted)">Ainda não gerada.</div>','<button class="btn" data-cp-go="editorial">Abrir</button>');
    h+=sec("Calendário editorial",items.length?'<div style="font-size:13px;margin-bottom:8px">'+items.length+' conteúdos · '+aprov+' aprovado(s) pelo cliente'+(ajuste?' · <b style="color:var(--warn)">'+ajuste+' ajuste(s) pedido(s)</b>':'')+'</div>'+(prox.length?prox.map(function(it){return '<div class="ag-row" style="cursor:default"><span class="ag-t">'+esc(itemHora(it,r))+'</span><div><b>'+esc(dataBR(it.data))+'</b> · '+surfIc(it.idea.surface)+' '+esc(pecaTitulo(it))+'</div></div>'}).join(''):'<div style="font-size:12.5px;color:var(--muted)">Sem publicações futuras.</div>'):'<div style="font-size:13px;color:var(--muted)">Ainda não montado.</div>',
      '<button class="btn" data-cp-go="calendar">Abrir</button>'+(items.length?'<button class="btn" id="cpVerCliente">Ver como o cliente</button>':'')+(brief&&!items.length&&aiAvailable()?'<button class="btn pri" id="cpMontar">Montar tudo</button>':''));
    el.innerHTML=h;
    I("#cpVoltar").addEventListener('click',function(){state.ativosOpen=null;renderAtivos();});
    I("#cpEdit").addEventListener('click',function(){openEditCliente(id);});
    Array.prototype.forEach.call(el.querySelectorAll('[data-cp-go]'),function(b){b.addEventListener('click',function(){go(b.getAttribute('data-cp-go'));})});
    var vc=I("#cpVerCliente");if(vc)vc.addEventListener('click',function(){state.view="calendar";toggleClientView(true);});
    var mt=I("#cpMontar");if(mt)mt.addEventListener('click',function(){montarTudo(id,30);});
    function abrirEditor(){var b=I("#cpBriefEdit");b.hidden=false;I("#cpBriefTxt").focus();}
    ["#cpEscrever","#cpEscrever2"].forEach(function(s){var b=I(s);if(b)b.addEventListener('click',abrirEditor);});
    ["#cpColar","#cpColar2"].forEach(function(s){var b=I(s);if(b)b.addEventListener('click',function(){openBriefImportModal(id);});});
    var fm=I("#cpForm");if(fm)fm.addEventListener('click',function(){openBriefFormModal(c.name);});
    I("#cpBriefSalvar").addEventListener('click',async function(){var tx=I("#cpBriefTxt").value.trim(),m=I("#cpBriefMsg");if(!tx){m.textContent="Escreva o briefing primeiro.";return;}
      setBusy(m,"Salvando…");
      try{await saveClientRecord(id,Object.assign({},DB_CLIENTS[id],{briefing:tx}));
        var dnaDoc=await dbDoc("cos_dna/"+id).get(),atuais=dnaDoc.exists?((dnaDoc.data()||{}).entries||[]):[];
        if(!atuais.length){var novas=irisToDnaEntries(irisExtract(tx,"Briefing (painel), "+new Date().toLocaleDateString("pt-BR")));await dbDoc("cos_dna/"+id).set({entries:novas});delete DB_STATE_CACHE[id];}
        clearBusy(m);toast("Briefing salvo no cadastro de "+c.name+", ele passa a alimentar as gerações.");if(state.client===id){GENERATED=await loadDbClientState(id);}renderAtivos();}
      catch(e){clearBusy(m);m.textContent="Não consegui salvar agora.";}});
    if(state.ativosBrief&&!brief){state.ativosBrief=false;var bx=I("#cpBriefEdit");if(bx)bx.scrollIntoView({block:"center"});}
  }
  // ---- Organização: apagar cliente e juntar cadastros duplicados ----
  var DOCS_CLIENTE=["cos_dna","cos_strategy","cos_editorial","cos_research","cos_refs","cos_formats","cos_exemplos","cos_meta","cos_perf"],COLS_CLIENTE=["cos_ideas","cos_calendar"];
  async function apagarCliente(id){
    for(var i=0;i<COLS_CLIENTE.length;i++){var sn=await dbItemsCol(COLS_CLIENTE[i],id).get();for(var j=0;j<sn.docs.length;j++)await dbItemsCol(COLS_CLIENTE[i],id).doc(sn.docs[j].id).delete();}
    for(var k=0;k<DOCS_CLIENTE.length;k++){try{await dbDoc(DOCS_CLIENTE[k]+"/"+id).delete();}catch(e){}}
    await dbDoc("cos_clients/"+id).delete();
    delete DB_CLIENTS[id];delete DB_STATE_CACHE[id];
    for(var n=CLIENTS.length-1;n>=0;n--)if(CLIENTS[n].id===id)CLIENTS.splice(n,1);
    if(state.ativosOpen===id)state.ativosOpen=null;
    if(state.client===id){state.client="";var prox=CLIENTS[0];if(prox)setClient(prox.id);else{GENERATED=null;}}
    refreshClientOptions();
  }
  async function juntarClientes(destId,origId){
    var A=Object.assign({},DB_CLIENTS[destId]),B=DB_CLIENTS[origId];if(!A||!B)return;
    var bA=String(A.briefing||"").trim(),bB=String(B.briefing||"").trim();A.briefing=bA&&bB&&bA!==bB?bA+"\n\n---\n"+bB:(bA||bB);
    A.niche=A.niche||B.niche||"";A.ficha=Object.assign({},B.ficha||{},A.ficha||{});Object.keys(B.ficha||{}).forEach(function(k){if(!A.ficha[k])A.ficha[k]=B.ficha[k];});
    var ad=Object.assign({},B.admin||{},A.admin||{});Object.keys(B.admin||{}).forEach(function(k){if(!ad[k])ad[k]=B.admin[k];});A.admin=ad;
    ["metas","rotina","vitrine","prefs"].forEach(function(k){if(!A[k]&&B[k])A[k]=B[k];});
    await saveClientRecord(destId,A);
    var dA=await dbDoc("cos_dna/"+destId).get(),dB=await dbDoc("cos_dna/"+origId).get(),eA=dA.exists?((dA.data()||{}).entries||[]):[],eB=dB.exists?((dB.data()||{}).entries||[]):[];
    var vistos={};eA.forEach(function(e){vistos[e.field+"|"+e.value]=1;});eB.forEach(function(e){if(!vistos[e.field+"|"+e.value])eA.push(e);});
    if(eA.length)await dbDoc("cos_dna/"+destId).set({entries:eA});
    for(var i=0;i<DOCS_CLIENTE.length;i++){var nm=DOCS_CLIENTE[i];if(nm==="cos_dna")continue;var a=await dbDoc(nm+"/"+destId).get();if(!a.exists){var b=await dbDoc(nm+"/"+origId).get();if(b.exists)await dbDoc(nm+"/"+destId).set(b.data());}}
    for(var j=0;j<COLS_CLIENTE.length;j++){var ca=await dbItemsCol(COLS_CLIENTE[j],destId).get();if(!ca.docs.length){var cb=await dbItemsCol(COLS_CLIENTE[j],origId).get();for(var n=0;n<cb.docs.length;n++)await dbItemsCol(COLS_CLIENTE[j],destId).doc(cb.docs[n].id).set(cb.docs[n].data());}}
    delete DB_STATE_CACHE[destId];
    await apagarCliente(origId);
  }
  async function renderBackupBanner(){var el=I("#ovBackup");if(!el)return;if(state.clientView||CAP.local||!Object.keys(DB_CLIENTS).length){el.innerHTML="";return;}
    var cfg=await adminCfg(),ult=cfg.lastBackup?new Date(cfg.lastBackup):null,dias=ult?Math.floor((Date.now()-ult.getTime())/86400000):null;
    if(ult&&dias<30){el.innerHTML="";return;}
    el.innerHTML='<div class="card pad" style="margin-top:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span style="font-size:20px"></span><div style="flex:1;min-width:200px"><b>Backup do mês</b><div style="font-size:12.5px;color:var(--muted)">'+(ult?'O último backup foi há '+dias+' dias.':'Você ainda não fez nenhum backup.')+' Leva 10 segundos e guarda uma cópia de todos os clientes.</div></div><button class="btn" id="bkGoCfg">Fazer backup</button></div>';
    I("#bkGoCfg").addEventListener('click',function(){go("config");});}
  function openEditCliente(id){
    var c=DB_CLIENTS[id],a=adminOf(c),f=c.ficha||{};
    I("#overlay").innerHTML='<div class="scrim" id="scrim"></div><aside class="drawer" role="dialog" style="width:min(460px,100%)"><div class="dh"><div class="d-title">Dados do cliente <span class="tag-mock">só você vê</span></div><button class="icon-btn" id="dclose">✕</button></div><div class="db"><div class="block">'+
      '<div class="fld"><label for="ecNome">Nome</label><input id="ecNome" value="'+esc(c.name||"")+'"></div>'+
      '<div class="fld"><label for="ecArea">Profissão / área de atuação</label><input id="ecArea" value="'+esc(c.niche||"")+'"></div>'+
      '<div class="fld"><label for="ecIg">Instagram (@)</label><input id="ecIg" value="'+esc(f.instagram||"")+'" placeholder="@perfil"></div>'+
      '<div class="fld"><label for="ecContato">Nome da pessoa de contato (usado na mensagem de cobrança)</label><input id="ecContato" value="'+esc(a.contato)+'" placeholder="Ex.: Ana"></div>'+
      '<div class="fld"><label for="ecWa">WhatsApp</label><input id="ecWa" value="'+esc(a.whats)+'" placeholder="11 99999-9999"></div>'+
      '<div class="grid cols-2" style="gap:12px"><div class="fld"><label for="ecValor">Valor mensal (R$)</label><input id="ecValor" inputmode="decimal" value="'+(a.valor?String(a.valor).replace(".",","):"")+'" placeholder="1.500,00"></div>'+
      '<div class="fld"><label for="ecVenc">Dia do pagamento</label><select id="ecVenc">'+[5,10,15,20,25,30].map(function(d){return '<option value="'+d+'"'+(a.venc===d?' selected':'')+'>Dia '+d+'</option>'}).join('')+'</select></div></div>'+
      '<label style="display:flex;gap:8px;align-items:center;font-size:13px;margin:4px 0 14px"><input type="checkbox" id="ecAtivo"'+(a.ativo?' checked':'')+'> Cliente ativo (desmarcar não apaga nada, o histórico fica guardado)</label>'+
      '<button class="btn pri" id="ecSalvar">Salvar</button><span id="ecMsg" style="margin-left:10px;font-size:12px;color:var(--muted)"></span></div>'+
      (Object.keys(DB_CLIENTS).length>1?'<div class="block"><div class="bt">Cadastro duplicado?</div><div style="font-size:12px;color:var(--muted);margin-bottom:8px">Junta o outro cadastro <b>neste</b>: briefing, ficha, contatos e Content DNA são somados; estratégia, linha editorial, ideias e calendário do outro entram só onde este estiver vazio. Depois o outro cadastro é removido.</div>'+
        '<div style="display:flex;gap:8px;flex-wrap:wrap"><select id="ecMergeSel" style="flex:1;min-width:160px;font:inherit;font-size:13px;border:1px solid var(--line);border-radius:9px;padding:7px;background:var(--surface-2);color:var(--ink)">'+Object.keys(DB_CLIENTS).filter(function(x){return x!==id}).map(function(x){return '<option value="'+esc(x)+'">'+esc(DB_CLIENTS[x].name)+'</option>'}).join('')+'</select><button class="btn" id="ecMerge">🔀 Juntar neste cadastro</button></div></div>':'')+
      '<div class="block" style="border-color:var(--emo-bg)"><div class="bt" style="color:var(--emo)">Zona de cuidado</div><div style="font-size:12px;color:var(--muted);margin-bottom:8px">Apagar remove o cliente e todo o histórico (briefing, estratégia, calendário, aprovações). Se só parou de atender, prefira <b>marcar como inativo</b>.</div><button class="btn" id="ecApagar" style="color:var(--emo)">🗑 Apagar cliente</button></div></div></aside>';
    I("#scrim").addEventListener('click',closeDrawer);I("#dclose").addEventListener('click',closeDrawer);document.addEventListener('keydown',escClose);
    var mg=I("#ecMerge");if(mg)mg.addEventListener('click',async function(){var orig=I("#ecMergeSel").value,on=DB_CLIENTS[orig]&&DB_CLIENTS[orig].name;
      if(!orig||!confirm("Juntar “"+on+"” em “"+c.name+"”? O cadastro “"+on+"” deixa de existir depois de juntar."))return;
      mg.disabled=true;mg.textContent="Juntando…";try{await (SB?comContexto({restaurar:true,motivo:"juntar cadastros"},function(){return juntarClientes(id,orig)}):juntarClientes(id,orig));closeDrawer();toast("Cadastros juntados em "+c.name+".");if(state.client===id)GENERATED=await loadDbClientState(id);renderAtivos();}catch(e){mg.disabled=false;mg.textContent="🔀 Juntar neste cadastro";toast("Não consegui juntar agora.");}});
    I("#ecApagar").addEventListener('click',async function(){var t=prompt("Isso apaga "+c.name+" e todo o histórico, sem volta.\nPara confirmar, digite o nome do cliente:");
      if(t===null)return;if(normalizeTextPanel(t).trim()!==normalizeTextPanel(c.name).trim()){toast("Nome não confere, nada foi apagado.");return;}
      try{await apagarCliente(id);closeDrawer();toast(c.name+" foi apagado.");renderAtivos();renderCobrancaBanner();}catch(e){toast("Não consegui apagar agora.");}});
    I("#ecSalvar").addEventListener('click',async function(){
      var nome=I("#ecNome").value.trim();if(!nome){I("#ecMsg").textContent="O nome não pode ficar vazio.";return;}
      var v=parseFloat(I("#ecValor").value.replace(/[^\d,.-]/g,"").replace(/\.(?=\d{3}(\D|$))/g,"").replace(",","."))||0;
      var rec=Object.assign({},DB_CLIENTS[id]);rec.name=nome;rec.niche=I("#ecArea").value.trim();rec.ficha=Object.assign({},rec.ficha||{},{instagram:I("#ecIg").value.trim()});
      rec.admin=Object.assign({},rec.admin||{},{contato:I("#ecContato").value.trim(),whats:I("#ecWa").value.trim(),valor:v,venc:+I("#ecVenc").value,ativo:I("#ecAtivo").checked});
      try{await saveClientRecord(id,rec);var cl=byId(id);if(cl){cl.name=nome;cl.niche=rec.niche;cl.full=nome+(rec.niche?", "+rec.niche:"");}refreshClientOptions();closeDrawer();toast("Dados salvos.");renderAtivos();renderCobrancaBanner();}
      catch(e){I("#ecMsg").textContent="Não consegui salvar agora.";}});
  }
  async function openTplCobranca(){
    var cfg=await adminCfg();
    I("#overlay").innerHTML='<div class="scrim" id="scrim"></div><aside class="drawer" role="dialog" style="width:min(460px,100%)"><div class="dh"><div class="d-title">Mensagem de cobrança</div><button class="icon-btn" id="dclose">✕</button></div><div class="db"><div class="block">'+
      '<div class="fld"><label for="tcTxt">Edite à vontade, [nome], [valor], [mes] e [dia] são trocados automaticamente</label><textarea class="ta" id="tcTxt" style="min-height:140px">'+esc(cfg.tplCobranca||COBRANCA_PADRAO)+'</textarea></div>'+
      '<button class="btn pri" id="tcSalvar">Salvar</button><button class="btn ghost" id="tcPadrao" style="margin-left:6px">Voltar ao padrão</button></div></div></aside>';
    I("#scrim").addEventListener('click',closeDrawer);I("#dclose").addEventListener('click',closeDrawer);document.addEventListener('keydown',escClose);
    I("#tcPadrao").addEventListener('click',function(){I("#tcTxt").value=COBRANCA_PADRAO;});
    I("#tcSalvar").addEventListener('click',async function(){await salvarAdminCfg({tplCobranca:I("#tcTxt").value});closeDrawer();toast("Mensagem de cobrança salva.");});
  }
  async function openGcalCobranca(){
    var ativos=Object.keys(DB_CLIENTS).map(function(id){return DB_CLIENTS[id]}).filter(function(c){var a=adminOf(c);return a.ativo&&a.valor>0});
    var dias=ativos.map(function(c){return adminOf(c).venc}).filter(function(v,i,a){return a.indexOf(v)===i}).sort(function(a,b){return a-b});if(!dias.length)dias=[10,15];
    var cfg=await adminCfg(),feitos=cfg.gcalCobranca||{};
    I("#overlay").innerHTML='<div class="scrim" id="scrim"></div><aside class="drawer" role="dialog" style="width:min(460px,100%)"><div class="dh"><div class="d-title">Lembrete mensal de cobrança</div><button class="icon-btn" id="dclose">✕</button></div><div class="db"><div class="block">'+
      '<div style="font-size:12.5px;color:var(--muted);margin-bottom:12px">Cria na sua Google Agenda um lembrete que se repete <b>todo mês</b>, às 9h, nos dias escolhidos. No dia, abra <b>Clientes ativos</b> para cobrar com a mensagem pronta e marcar quem pagou.</div>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px">'+[5,10,15,20,25,30].map(function(d){return '<label style="display:flex;gap:6px;align-items:center;font-size:13px"><input type="checkbox" class="gcDia" value="'+d+'"'+(dias.indexOf(d)>=0?' checked':'')+(feitos[d]?' disabled':'')+'> Dia '+d+(feitos[d]?' ✓':'')+'</label>'}).join('')+'</div>'+
      '<button class="btn pri" id="gcCob">📆 Criar lembrete(s)</button><span id="gcCobMsg" style="margin-left:10px;font-size:12px;color:var(--muted)"></span></div></div></aside>';
    I("#scrim").addEventListener('click',closeDrawer);I("#dclose").addEventListener('click',closeDrawer);document.addEventListener('keydown',escClose);
    I("#gcCob").addEventListener('click',async function(){
      var sel=Array.prototype.map.call(document.querySelectorAll('.gcDia:checked:not(:disabled)'),function(x){return +x.value}),m=I("#gcCobMsg"),btn=I("#gcCob");
      if(!sel.length){m.textContent="Escolha ao menos um dia.";return;}
      var mcp=null;try{mcp=window.claude&&claude.use?await claude.use("mcp"):null;}catch(e){}
      if(!mcp){m.textContent=gcalErr({code:"no_mcp"});m.style.color="var(--warn)";return;}
      btn.disabled=true;var ok=Object.assign({},feitos);
      for(var i=0;i<sel.length;i++){var d=sel[i],hoje=new Date(),alvo=new Date(hoje.getFullYear(),hoje.getMonth(),d);if(alvo<new Date(hoje.getFullYear(),hoje.getMonth(),hoje.getDate()))alvo=new Date(hoje.getFullYear(),hoje.getMonth()+1,d);
        var ds=fmtD(alvo),quem=ativos.filter(function(c){return adminOf(c).venc===d}).map(function(c){return c.name}).join(", ");
        setBusy(m,"Criando lembrete do dia "+d+"…");
        try{var res=await mcp.callTool("Google Calendar","create_event",{summary:"Dia "+d+": cobrar clientes do mês",startTime:ds+"T09:00:00",endTime:ds+"T09:15:00",timeZone:"America/Sao_Paulo",recurrenceData:["RRULE:FREQ=MONTHLY;BYMONTHDAY="+d],
          description:"Abra o painel Content OS, Clientes ativos para enviar a mensagem de cobrança e marcar quem já pagou."+(quem?"<br>Vencem neste dia (quando o lembrete foi criado): "+esc(quem):""),overrideReminders:[{method:"popup",minutes:0}]},{cache:false});
          var pl=res&&res.payload;ok[d]=String((pl&&(pl.id||pl.eventId))||"ok");}
        catch(e){clearBusy(m);m.textContent=gcalErr(e);m.style.color="var(--warn)";btn.disabled=false;await salvarAdminCfg({gcalCobranca:ok});return;}
      }
      await salvarAdminCfg({gcalCobranca:ok});clearBusy(m);m.textContent="Lembrete(s) criado(s) na sua Google Agenda, todo dia "+sel.join(" e ")+".";m.style.color="var(--good)";
    });
  }
  function openNewClientModal(){
    if(!CAP.db){
      I("#overlay").innerHTML='<div class="scrim" id="scrim"></div><aside class="drawer" role="dialog" style="width:min(440px,100%)"><div class="dh"><div class="d-title">IA ao vivo indisponível aqui</div><button class="icon-btn" id="dclose">✕</button></div><div class="db"><div class="block"><div style="font-size:13px;color:var(--muted)">Cadastrar um cliente novo e gerar com IA real só funciona quando este painel é aberto pelo <b>link publicado no claude.ai</b>, a cópia offline (arquivo local) não tem essa capacidade. Peça o link do painel para usar esta função.</div></div></div></aside>';
      I("#scrim").addEventListener('click',closeDrawer);I("#dclose").addEventListener('click',closeDrawer);document.addEventListener('keydown',escClose);
      return;
    }
    var html='<div class="scrim" id="scrim"></div><aside class="drawer" role="dialog" style="width:min(440px,100%)"><div class="dh"><div class="d-title">Novo cliente</div><button class="icon-btn" id="dclose">✕</button></div><div class="db">'+
      '<div class="block"><p class="texto" style="color:var(--muted);margin-bottom:20px">O cliente começa em branco. Preencha o que já souber: a Íris lê o briefing e o planejamento começa sozinho.</p>'+
      '<div class="fld"><label for="ncName">Nome do cliente</label><input id="ncName" placeholder="Ex.: Consultório Dr. Paulo"></div>'+
      '<div class="fld"><label for="ncNiche">Nicho / segmento</label><input id="ncNiche" placeholder="Ex.: Odontologia"></div>'+
      '<div class="bt" style="margin-top:8px">Opcional, dá para completar depois na ficha</div>'+
      '<div class="fld"><label for="ncInsta">Instagram (@)</label><input id="ncInsta" placeholder="@perfil"></div>'+
      '<div class="fld"><label for="ncOferta">Produtos / serviços principais</label><input id="ncOferta" placeholder="Ex.: lentes de contato dental, clareamento"></div>'+
      '<div class="fld"><label for="ncPublico">Público-alvo</label><input id="ncPublico" placeholder="Ex.: mulheres de 30 a 50 anos que querem sorrir sem vergonha"></div>'+
      '<div class="fld"><label for="ncTom">Tom de voz</label><input id="ncTom" placeholder="Ex.: acolhedor, sem jargão"></div>'+
      '<div class="fld"><label for="ncBrief">Briefing / anotações da reunião</label><textarea class="ta" id="ncBrief" style="min-height:90px" placeholder="Cole aqui o que o cliente contou. A Íris usa isso para montar o Content DNA."></textarea></div>'+
      '<button class="btn pri genbtn" id="ncCreate">Criar cliente</button><span id="ncMsg" style="margin-left:10px;font-size:12px;color:var(--muted)"></span></div></div></aside>';
    I("#overlay").innerHTML=html;
    I("#scrim").addEventListener('click',closeDrawer);I("#dclose").addEventListener('click',closeDrawer);document.addEventListener('keydown',escClose);
    I("#ncCreate").addEventListener('click',async function(){
      var name=I("#ncName").value.trim(),niche=I("#ncNiche").value.trim();
      if(!name){I("#ncMsg").textContent="Digite o nome do cliente.";I("#ncMsg").style.color="var(--warn)";return;}
      I("#ncCreate").disabled=true;I("#ncMsg").textContent="Criando…";I("#ncMsg").style.color="var(--muted)";
      try{
        var id=await createClient(name,niche);
        var ficha={instagram:I("#ncInsta").value.trim(),oferta:I("#ncOferta").value.trim(),publico:I("#ncPublico").value.trim(),tom:I("#ncTom").value.trim()},brief=I("#ncBrief").value.trim();
        if(ficha.instagram||ficha.oferta||ficha.publico||ficha.tom||brief){try{await saveClientRecord(id,Object.assign({},DB_CLIENTS[id],{ficha:ficha,briefing:brief}));}catch(e){}}
        closeDrawer();
        setClient(id);go("dna");
      }catch(e){
        I("#ncMsg").textContent="Não deu pra criar agora, tente de novo.";I("#ncMsg").style.color="var(--warn)";I("#ncCreate").disabled=false;
      }
    });
  }

